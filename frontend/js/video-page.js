// JavaScript для страницы видео-галереи
// Juggler Video Page Logic

// API_URL is defined in main.js. If not, fallback.
const BASE_API_URL = typeof API_URL !== 'undefined' ? API_URL : '/api'

let videoList = []
let currentVideoIndex = 0

document.addEventListener('DOMContentLoaded', () => {
	initVideoGallery()
	// Force static visibility
	document.querySelectorAll('.animate-text').forEach(el => {
		el.style.opacity = '1'
		el.style.transform = 'none'
		el.classList.remove('animate-text')
	})
})

async function initVideoGallery() {
	const grid = document.getElementById('videoGrid')
	const bgVideo = document.getElementById('bgVideo')

	if (!grid) return

	try {
		// 1. Fetch Videos & Settings
		const [videosRes, settingsRes] = await Promise.all([
			fetch(`${BASE_API_URL}/videos`),
			fetch(`${BASE_API_URL}/settings`)
		])
		
		if (!videosRes.ok) throw new Error(`HTTP error! status: ${videosRes.status}`)

		let videos = await videosRes.json()
		const settings = await settingsRes.json()
		const useFirstFrame = settings['video_preview_first_frame'] === 'true'

		if (!Array.isArray(videos)) {
			throw new Error('API response is not an array')
		}

		// Filter valid videos if necessary
		if (videos.length === 0) {
			grid.innerHTML =
				'<div class="no-content" style="color: white; text-align: center;">Видео скоро появятся</div>'
			return
		}

		// 2. Set Background (First Video)
		if (bgVideo && videos.length > 0) {
			const bgUrl = getFullMediaUrl(videos[0].url)
			bgVideo.src = bgUrl
			bgVideo.play().catch(() => {})
		}

		videoList = videos

		// 3. Render Grid
		grid.innerHTML = ''
		videoList.forEach((video, index) => {
			const card = createVideoCard(video, index, useFirstFrame)
			grid.appendChild(card)
		})

		// 4. Init Modal Logic
		initModal()
	} catch (error) {
		console.error('Video gallery error:', error)
		grid.innerHTML = '<div class="no-content">Видео скоро появятся</div>'
	}
}

// Helper: Get full URL for media files
function getFullMediaUrl(url) {
	if (!url) return ''
	if (url.startsWith('http')) return url

	// Clean path
	let path = url.startsWith('/') ? url.substring(1) : url

	// If API is remote/localhost:3000, media is there too
	// Remove '/api' from the end of BASE_API_URL
	const baseUrl = BASE_API_URL.replace(/\/api$/, '')
	return `${baseUrl}/${path}`
}

function createVideoCard(video, index, useFirstFrame = false) {
	let safeUrl = getFullMediaUrl(video.url)
	
	// Если есть персонализированное превью, загружаем его.
	// Избегаем #t=0.1, так как это ломает загрузку видео на Android.
	// Вместо этого устанавливаем currentTime = 0.1 программно после загрузки метаданных.
	let posterAttr = ''
	if (video.preview_url) {
		posterAttr = `poster="${getFullMediaUrl(video.preview_url)}"`
	}

	const card = document.createElement('div')
	card.className = 'video-card'

	card.innerHTML = `
        <div class="video-thumbnail">
            <video src="${safeUrl}" ${posterAttr} muted preload="metadata" playsinline></video>
            <div class="play-overlay">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </div>
        </div>
        <div class="video-card-info" style="display: none;">
            <h3>${video.title}</h3>
        </div>
    `

	card.addEventListener('click', () => openModal(index))

	const videoEl = card.querySelector('video')
	const resetTime = useFirstFrame ? 0.1 : 0

	if (useFirstFrame && !video.preview_url) {
		videoEl.addEventListener('loadedmetadata', () => {
			if (videoEl.currentTime === 0 && videoEl.paused) {
				videoEl.currentTime = 0.1;
			}
		}, { once: true });
	}

	card.addEventListener('mouseenter', () => videoEl.play().catch(() => {}))
	card.addEventListener('mouseleave', () => {
		videoEl.pause()
		videoEl.currentTime = resetTime
	})

	return card
}

// Modal Logic with Custom Player
let customPlayer = null

function initModal() {
	const modal = document.getElementById('videoModal')
	const closeBtn = document.getElementById('modalClose')
	const backdrop = document.getElementById('modalBackdrop')
	const prevBtn = document.getElementById('videoPrev')
	const nextBtn = document.getElementById('videoNext')

	if (!modal) return

	const close = () => {
		modal.classList.remove('active')
		if (customPlayer) {
			customPlayer.destroy()
			customPlayer = null
		}
		document.body.style.overflow = ''
	}

	if (closeBtn) closeBtn.addEventListener('click', close)
	if (backdrop) backdrop.addEventListener('click', close)

	if (prevBtn) prevBtn.addEventListener('click', () => navigateVideo(-1))
	if (nextBtn) nextBtn.addEventListener('click', () => navigateVideo(1))

	document.addEventListener('keydown', e => {
		if (e.key === 'Escape' && modal.classList.contains('active')) close()
		if (e.key === 'ArrowLeft' && modal.classList.contains('active'))
			navigateVideo(-1)
		if (e.key === 'ArrowRight' && modal.classList.contains('active'))
			navigateVideo(1)
	})

	// Touch поддержка для свайпа удалена (чтобы не мешала ползунку видео)
}

function navigateVideo(direction) {
	if (videoList.length === 0) return
	currentVideoIndex =
		(currentVideoIndex + direction + videoList.length) % videoList.length
	updateModalContent()
}



function updateModalContent() {
	const modal = document.getElementById('videoModal')
	const playerContainer = modal.querySelector('.video-player-container')
	const title = document.getElementById('videoTitle')
	const desc = document.getElementById('videoDescription')

	if (!modal || !playerContainer || videoList.length === 0) return

	const video = videoList[currentVideoIndex]

	// Clear previous player
	playerContainer.innerHTML = ''

	// Create new Custom Player
	const videoUrl = getFullMediaUrl(video.url)
	customPlayer = new CustomVideoPlayer(playerContainer, videoUrl)

	if (title) title.textContent = video.title
	if (desc) desc.textContent = video.description || ''
}

function openModal(index) {
	const modal = document.getElementById('videoModal')
	if (!modal) return

	currentVideoIndex = index
	updateModalContent()

	modal.classList.add('active')
	document.body.style.overflow = 'hidden'
}

// ========== CUSTOM VIDEO PLAYER CLASS ==========
class CustomVideoPlayer {
	constructor(container, videoUrl) {
		this.container = container
		this.videoUrl = videoUrl
		this.isDragging = false

		this.render()
		this.video = this.container.querySelector('video')
		this.controls = this.container.querySelector('.custom-controls')
		this.playBtn = this.container.querySelector('.play-btn')
		this.progressContainer = this.container.querySelector('.progress-container')
		this.progressBar = this.container.querySelector('.progress-bar')
		this.volumeBtn = this.container.querySelector('.volume-btn')
		this.volumeSlider = this.container.querySelector('.volume-slider')
		this.fullscreenBtn = this.container.querySelector('.fullscreen-btn')
		this.timeDisplay = this.container.querySelector('.time-display')

		this.initEvents()
	}

	render() {
		this.container.innerHTML = `
            <div class="custom-video-player">
                <video src="${this.videoUrl}" playsinline></video>
                <div class="center-play-btn">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div class="custom-controls">
                    <div class="progress-container">
                        <div class="progress-bg"></div>
                        <div class="progress-bar"></div>
                    </div>
                    <div class="controls-row">
                        <div class="left-controls">
                            <button class="control-btn play-btn" aria-label="Play/Pause">
                                <svg class="icon-play" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                                <svg class="icon-pause" width="24" height="24" viewBox="0 0 24 24" fill="white" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            </button>
                            <div class="volume-control">
                                <button class="control-btn volume-btn" aria-label="Mute/Unmute">
                                    <svg class="icon-vol-high" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                                    <svg class="icon-vol-mute" width="24" height="24" viewBox="0 0 24 24" fill="white" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                                </button>
                                <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1">
                            </div>
                            <span class="time-display">0:00 / 0:00</span>
                        </div>
                        <div class="right-controls">
                            <button class="control-btn fullscreen-btn" aria-label="Fullscreen">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
	}

	initEvents() {
		// Play/Pause
		this.playBtn.addEventListener('click', () => this.togglePlay())
		this.container
			.querySelector('.center-play-btn')
			.addEventListener('click', () => this.togglePlay())
		this.video.addEventListener('click', () => this.togglePlay())

		// Update UI on play/pause
		this.video.addEventListener('play', () => this.updatePlayBtn(true))
		this.video.addEventListener('pause', () => this.updatePlayBtn(false))

		// Progress
		this.video.addEventListener('timeupdate', () => this.updateProgress())
		this.video.addEventListener('loadedmetadata', () => {
			this.updateTimeDisplay()
			// Auto play when loaded
			this.video.play().catch(() => {})
		})

		this.progressContainer.addEventListener('mousedown', e =>
			this.startDragging(e),
		)
		document.addEventListener('mousemove', e => {
			if (this.isDragging) this.handleDrag(e)
		})
		document.addEventListener('mouseup', () => this.stopDragging())
		this.progressContainer.addEventListener('click', e => this.seek(e))

		// Volume
		this.volumeBtn.addEventListener('click', () => this.toggleMute())
		this.volumeSlider.addEventListener('input', e => {
			this.video.volume = e.target.value
			this.video.muted = e.target.value === '0'
			this.updateVolumeIcon()
		})

		// Fullscreen
		this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen())
		this.container.addEventListener('dblclick', () => this.toggleFullscreen())

		// Hide controls on inactivity
		let timeout
		this.container.addEventListener('mousemove', () => {
			this.container.classList.remove('hide-controls')
			clearTimeout(timeout)
			timeout = setTimeout(() => {
				if (!this.video.paused) {
					this.container.classList.add('hide-controls')
				}
			}, 3000)
		})
	}

	togglePlay() {
		if (this.video.paused) {
			this.video.play()
		} else {
			this.video.pause()
		}
	}

	updatePlayBtn(isPlaying) {
		const centerBtn = this.container.querySelector('.center-play-btn')
		const iconPlay = this.playBtn.querySelector('.icon-play')
		const iconPause = this.playBtn.querySelector('.icon-pause')

		if (isPlaying) {
			centerBtn.style.opacity = '0'
			centerBtn.style.pointerEvents = 'none'
			iconPlay.style.display = 'none'
			iconPause.style.display = 'block'
		} else {
			centerBtn.style.opacity = '1'
			centerBtn.style.pointerEvents = 'auto'
			iconPlay.style.display = 'block'
			iconPause.style.display = 'none'
		}
	}

	updateProgress() {
		if (this.isDragging) return
		const percent = (this.video.currentTime / this.video.duration) * 100
		this.progressBar.style.width = `${percent}%`
		this.updateTimeDisplay()
	}

	seek(e) {
		const rect = this.progressContainer.getBoundingClientRect()
		const pos = (e.clientX - rect.left) / rect.width
		this.video.currentTime = pos * this.video.duration
	}

	startDragging(e) {
		this.isDragging = true
		this.seek(e)
	}

	handleDrag(e) {
		if (!this.isDragging) return
		const rect = this.progressContainer.getBoundingClientRect()
		let pos = (e.clientX - rect.left) / rect.width
		pos = Math.max(0, Math.min(1, pos))
		this.progressBar.style.width = `${pos * 100}%`
		this.video.currentTime = pos * this.video.duration
	}

	stopDragging() {
		this.isDragging = false
	}

	toggleMute() {
		this.video.muted = !this.video.muted
		this.updateVolumeIcon()
		if (this.video.muted) {
			this.volumeSlider.value = 0
		} else {
			this.volumeSlider.value = this.video.volume || 1
		}
	}

	updateVolumeIcon() {
		const iconHigh = this.volumeBtn.querySelector('.icon-vol-high')
		const iconMute = this.volumeBtn.querySelector('.icon-vol-mute')

		if (this.video.muted || this.video.volume === 0) {
			iconHigh.style.display = 'none'
			iconMute.style.display = 'block'
		} else {
			iconHigh.style.display = 'block'
			iconMute.style.display = 'none'
		}
	}

	formatTime(seconds) {
		const mins = Math.floor(seconds / 60)
		const secs = Math.floor(seconds % 60)
		return `${mins}:${secs < 10 ? '0' : ''}${secs}`
	}

	updateTimeDisplay() {
		const current = this.formatTime(this.video.currentTime)
		const total = this.formatTime(this.video.duration || 0)
		this.timeDisplay.textContent = `${current} / ${total}`
	}

	toggleFullscreen() {
		if (!document.fullscreenElement) {
			this.container.requestFullscreen().catch(err => {
				console.error(`Error attempting to enable fullscreen: ${err.message}`)
			})
		} else {
			document.exitFullscreen()
		}
	}

	destroy() {
		// Cleanup events if needed
		this.video.pause()
		this.video.src = ''
		this.container.innerHTML = ''
	}
}
