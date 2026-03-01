// JavaScript для страницы фото-галереи
// API_URL определяется в main.js

let photos = []
let currentPhotoIndex = 0
let touchStartX = 0
let touchEndX = 0

document.addEventListener('DOMContentLoaded', () => {
	loadPhotos()
	initPhotoViewer()
	loadBackgroundVideo()

	// Disable text animations explicitly
	document.querySelectorAll('.animate-text').forEach(el => {
		el.style.opacity = '1'
		el.style.transform = 'none'
		el.classList.remove('animate-text')
	})
})

// Загрузка фотографий из БД
async function loadPhotos() {
	try {
		const response = await fetch(`${API_URL}/gallery`)
		photos = await response.json()
		renderPhotoGrid()
	} catch (error) {
		console.error('Ошибка загрузки фотографий:', error)
		showNoPhotos()
	}
}

// Отрисовка сетки фотографий
function renderPhotoGrid() {
	const grid = document.getElementById('photoGrid')
	if (!grid) return

	if (photos.length === 0) {
		showNoPhotos()
		return
	}

	grid.innerHTML = ''

	photos.forEach((photo, index) => {
		const card = document.createElement('div')
		card.className = 'photo-card'

		const imageUrl = photo.image_url
			? photo.image_url.startsWith('http')
				? photo.image_url
				: `/${photo.image_url}`
			: ''

		// Обработка crop данных
		let imageHTML = ''
		if (photo.crop_data) {
			imageHTML = getCroppedImageHTML(imageUrl, photo.crop_data)
		} else if (imageUrl) {
			imageHTML = `<img src="${imageUrl}" alt="${photo.title}" />`
		} else {
			// Градиент fallback
			const gradient =
				photo.background_gradient ||
				'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
			imageHTML = `<div class="gradient-bg" style="background: ${gradient}"></div>`
		}

		card.innerHTML = `
			<div class="photo-thumbnail">
				${imageHTML}
				<div class="photo-overlay">
					<h3>${photo.title}</h3>
				</div>
			</div>
		`

		card.addEventListener('click', () => openPhotoViewer(index))
		grid.appendChild(card)
	})
}

// Показать сообщение об отсутствии фото
function showNoPhotos() {
	const grid = document.getElementById('photoGrid')
	if (grid) {
		grid.innerHTML = `
			<div class="no-content">
				<p data-i18n="gallery.noPhotos">Фотографии скоро появятся</p>
			</div>
		`
		if (typeof i18n !== 'undefined') {
			i18n.updatePage()
		}
	}
}

// Вспомогательная функция для обрезки изображений
function getCroppedImageHTML(url, cropData) {
	if (!cropData) return `<img src="${url}" alt="" />`

	try {
		const crop = JSON.parse(cropData)
		if (crop.width && crop.height) {
			const widthPct = (crop.naturalWidth / crop.width) * 100
			const heightPct = (crop.naturalHeight / crop.height) * 100
			const xPct = (crop.x / crop.naturalWidth) * 100
			const yPct = (crop.y / crop.naturalHeight) * 100

			return `
				<div style="width: 100%; height: 100%; overflow: hidden; position: relative;">
					<img src="${url}" alt="" style="
						width: ${widthPct}%;
						height: ${heightPct}%;
						max-width: none;
						position: absolute;
						top: 0;
						left: 0;
						transform: translate(-${xPct}%, -${yPct}%);
						object-fit: fill;
					" />
				</div>
			`
		}
	} catch (e) {
		console.error('Ошибка парсинга crop данных:', e)
	}

	return `<img src="${url}" alt="" />`
}

// Инициализация просмотрщика фото
function initPhotoViewer() {
	const viewer = document.getElementById('photoViewer')
	const viewerClose = document.getElementById('viewerClose')
	const viewerPrev = document.getElementById('viewerPrev')
	const viewerNext = document.getElementById('viewerNext')
	const viewerContent = document.querySelector('.viewer-content')

	if (viewerClose) {
		viewerClose.addEventListener('click', closePhotoViewer)
	}

	if (viewerPrev) {
		viewerPrev.addEventListener('click', () => navigatePhoto(-1))
	}

	if (viewerNext) {
		viewerNext.addEventListener('click', () => navigatePhoto(1))
	}

	// Закрытие по ESC
	document.addEventListener('keydown', e => {
		if (e.key === 'Escape' && viewer && viewer.classList.contains('active')) {
			closePhotoViewer()
		}
		if (e.key === 'ArrowLeft') navigatePhoto(-1)
		if (e.key === 'ArrowRight') navigatePhoto(1)
	})

	// Touch поддержка для свайпа
	if (viewerContent) {
		viewerContent.addEventListener('touchstart', handleTouchStart, false)
		viewerContent.addEventListener('touchmove', handleTouchMove, false)
		viewerContent.addEventListener('touchend', handleTouchEnd, false)

		// Клики по краям для навигации (мобильные)
		viewerContent.addEventListener('click', e => {
			if (!viewer.classList.contains('active')) return

			const rect = viewerContent.getBoundingClientRect()
			const clickX = e.clientX - rect.left
			const width = rect.width

			// Левая треть - назад, правая треть - вперед
			if (clickX < width / 3) {
				navigatePhoto(-1)
			} else if (clickX > (width * 2) / 3) {
				navigatePhoto(1)
			}
		})
	}

	// Клик на backdrop
	document
		.querySelector('.viewer-backdrop')
		?.addEventListener('click', closePhotoViewer)
}

function openPhotoViewer(index) {
	currentPhotoIndex = index
	updatePhotoViewer()

	const viewer = document.getElementById('photoViewer')
	if (viewer) {
		viewer.classList.add('active')
		document.body.style.overflow = 'hidden'
	}
}

function closePhotoViewer() {
	const viewer = document.getElementById('photoViewer')
	if (viewer) {
		viewer.classList.remove('active')
		document.body.style.overflow = ''
	}
}

function navigatePhoto(direction) {
	const viewer = document.getElementById('photoViewer')
	if (!viewer || !viewer.classList.contains('active')) return

	currentPhotoIndex =
		(currentPhotoIndex + direction + photos.length) % photos.length
	updatePhotoViewer()
}

function updatePhotoViewer() {
	if (photos.length === 0) return

	const photo = photos[currentPhotoIndex]
	const viewerImage = document.getElementById('viewerImage')
	const viewerTitle = document.getElementById('viewerTitle')
	const viewerDescription = document.getElementById('viewerDescription')
	const viewerCounter = document.getElementById('viewerCounter')

	if (photo.image_url) {
		const imageUrl = photo.image_url.startsWith('http')
			? photo.image_url
			: `/${photo.image_url}`
		viewerImage.src = imageUrl
		viewerImage.alt = photo.title
	}

	if (viewerTitle) viewerTitle.textContent = photo.title
	if (viewerDescription) viewerDescription.textContent = photo.description || ''
	if (viewerCounter)
		viewerCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`
}

// Touch handlers для свайпа
function handleTouchStart(e) {
	touchStartX = e.changedTouches[0].screenX
}

function handleTouchMove(e) {
	touchEndX = e.changedTouches[0].screenX
}

function handleTouchEnd() {
	const swipeThreshold = 50
	const diff = touchStartX - touchEndX

	if (Math.abs(diff) > swipeThreshold) {
		if (diff > 0) {
			// Свайп влево - следующее фото
			navigatePhoto(1)
		} else {
			// Свайп вправо - предыдущее фото
			navigatePhoto(-1)
		}
	}
}

// Загрузка фонового видео
async function loadBackgroundVideo() {
	const bgVideo = document.getElementById('bgVideo')
	if (!bgVideo) return

	try {
		const response = await fetch(`${API_URL}/videos`)
		const videos = await response.json()

		if (videos.length > 0) {
			const videoUrl = videos[0].url.startsWith('http')
				? videos[0].url
				: `/${videos[0].url}`

			bgVideo.src = videoUrl
			bgVideo.play().catch(() => {})
		}
	} catch (error) {
		console.error('Ошибка загрузки фонового видео:', error)
	}
}
