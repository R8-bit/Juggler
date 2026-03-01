/**
 * JUGGLER ADMIN — Переработанная логика
 * Разделы: Видео, Галерея, Тексты (блоки), Соцсети, Настройки, Заявки CRM
 */

'use strict'

// ============================================================
// API
// ============================================================
const API = '/api'

const http = {
	async get(url) {
		const r = await fetch(API + url, { credentials: 'include' })
		if (r.status === 401 || r.status === 403) {
			window.location.href = '/login.html'
			throw new Error('Unauthorized')
		}
		if (!r.ok) throw new Error(await r.text())
		return r.json()
	},
	async post(url, data, isForm = false) {
		const headers = isForm ? {} : { 'Content-Type': 'application/json' }
		const body = isForm ? data : JSON.stringify(data)
		const r = await fetch(API + url, {
			method: 'POST',
			headers,
			body,
			credentials: 'include',
		})
		if (r.status === 401 || r.status === 403) {
			window.location.href = '/login.html'
			throw new Error('Unauthorized')
		}
		if (!r.ok) throw new Error(await r.text())
		return r.json()
	},
	async put(url, data) {
		const r = await fetch(API + url, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include',
		})
		if (r.status === 401 || r.status === 403) {
			window.location.href = '/login.html'
			throw new Error('Unauthorized')
		}
		if (!r.ok) throw new Error(await r.text())
		return r.json()
	},
	async del(url) {
		const r = await fetch(API + url, {
			method: 'DELETE',
			credentials: 'include',
		})
		if (r.status === 401 || r.status === 403) {
			window.location.href = '/login.html'
			throw new Error('Unauthorized')
		}
		if (!r.ok) throw new Error(await r.text())
		return r.json()
	},
}

// ============================================================
// TOAST
// ============================================================
function toast(msg, type = 'info') {
	const icons = { success: '✅', error: '❌', info: 'ℹ️' }
	const el = document.createElement('div')
	el.className = `toast ${type}`
	el.innerHTML = `<span>${icons[type] || ''}</span> <span>${msg}</span>`
	document.getElementById('toastContainer').appendChild(el)
	setTimeout(() => el.classList.add('show'), 10)
	setTimeout(() => {
		el.classList.remove('show')
		setTimeout(() => el.remove(), 300)
	}, 3000)
}

// ============================================================
// MODAL
// ============================================================
const modal = {
	overlay: null,
	saveBtn: null,
	init() {
		this.overlay = document.getElementById('modalOverlay')
		this.saveBtn = document.getElementById('modalSaveBtn')
		document.getElementById('modalCloseBtn').onclick = () => this.close()
		document.getElementById('modalCancelBtn').onclick = () => this.close()
		this.overlay.addEventListener('click', e => {
			if (e.target === this.overlay) this.close()
		})
	},
	open(title, bodyHtml, onSave) {
		document.getElementById('modalTitle').textContent = title
		document.getElementById('modalBody').innerHTML = bodyHtml
		this.overlay.classList.add('active')
		const newBtn = this.saveBtn.cloneNode(true)
		this.saveBtn.parentNode.replaceChild(newBtn, this.saveBtn)
		this.saveBtn = newBtn
		this.saveBtn.textContent = 'Сохранить'
		document.getElementById('modalCancelBtn').textContent = 'Отмена'
		if (onSave) {
			newBtn.style.display = ''
			newBtn.onclick = onSave
		} else {
			newBtn.style.display = 'none'
		}
	},
	close() {
		this.overlay.classList.remove('active')
	},
	confirm(title, msg, onConfirm) {
		this.open(
			title,
			`<div style="font-size:15px; margin-top:10px">${msg}</div>`,
			() => {
				if (onConfirm) onConfirm()
			},
		)
		this.saveBtn.textContent = 'Подтвердить'
		this.saveBtn.classList.remove('btn-primary')
		this.saveBtn.classList.add('btn-danger')

		// Reset back to normal on next open
		const originalOpen = this.open.bind(this)
		this.open = (t, body, cb) => {
			originalOpen(t, body, cb)
			this.saveBtn.classList.remove('btn-danger')
			this.saveBtn.classList.add('btn-primary')
			this.open = originalOpen
		}
	},
}

// ============================================================
// NAVIGATION
// ============================================================
function initNav() {
	const items = document.querySelectorAll('.nav-item[data-section]')
	const sections = document.querySelectorAll('.section')
	const titleEl = document.getElementById('pageTitle')

	items.forEach(item => {
		item.addEventListener('click', e => {
			e.preventDefault()
			const sec = item.dataset.section
			items.forEach(i => i.classList.remove('active'))
			item.classList.add('active')
			sections.forEach(s => s.classList.remove('active'))
			const target = document.getElementById('sec-' + sec)
			if (target) target.classList.add('active')
			titleEl.textContent = item.querySelector('.nav-label').textContent.trim()
			loadSection(sec)
		})
	})

	// Sidebar collapse
	const sidebar = document.getElementById('sidebar')

	const sidebarClose = document.getElementById('sidebarClose')
	if (sidebarClose) {
		sidebarClose.addEventListener('click', () => {
			sidebar.classList.remove('open')
		})
	}

	// Mobile Menu
	const mobileBtn = document.getElementById('mobileMenuToggle')
	if (mobileBtn) {
		mobileBtn.addEventListener('click', () => {
			sidebar.classList.toggle('open')
		})
	}

	// Close sidebar on mobile when an item is clicked
	items.forEach(item => {
		item.addEventListener('click', () => {
			if (window.innerWidth <= 1024) {
				sidebar.classList.remove('open')
			}
		})
	})

	// Первоначальная загрузка
	loadSection('dashboard')
}

function loadSection(sec) {
	switch (sec) {
		case 'dashboard':
			loadDashboard()
			break
		case 'stats':
			loadStats()
			break
		case 'videos':
			loadVideos()
			break
		case 'gallery':
			loadGallery()
			break
		case 'texts':
			loadTexts()
			break
		case 'social':
			loadSocial()
			break
		case 'settings':
			loadSettings()
			break
		case 'crm':
			loadCRM()
			break
		case 'security':
			loadSecurity()
			break
	}
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
	const grid = document.getElementById('dashboardGrid')
	grid.innerHTML = '<div class="loading-state">Загрузка...</div>'
	try {
		const data = await http.get('/admin/dashboard')
		grid.innerHTML = `
			<div class="stat-card" onclick="document.querySelector('[data-section=videos]').click()" style="cursor:pointer">
				<div class="stat-icon" style="color:#e63946">🎥</div>
				<div class="stat-info">
					<div class="stat-value">${data.videos}</div>
					<div class="stat-label">Видеозаписей</div>
				</div>
			</div>
			<div class="stat-card" onclick="document.querySelector('[data-section=gallery]').click()" style="cursor:pointer">
				<div class="stat-icon" style="color:#4ade80">📸</div>
				<div class="stat-info">
					<div class="stat-value">${data.gallery}</div>
					<div class="stat-label">Фотографий</div>
				</div>
			</div>
			<div class="stat-card" onclick="document.querySelector('[data-section=crm]').click()" style="cursor:pointer">
				<div class="stat-icon" style="color:#818cf8">✉️</div>
				<div class="stat-info">
					<div class="stat-value">${data.newRequests}</div>
					<div class="stat-label">Новых заявок</div>
				</div>
			</div>
			<div class="stat-card" onclick="document.querySelector('[data-section=stats]').click()" style="cursor:pointer">
				<div class="stat-icon" style="color:#f59e0b">👀</div>
				<div class="stat-info">
					<div class="stat-value">${data.visitsToday}</div>
					<div class="stat-label">Визитов сегодня</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon" style="color:#a855f7">📈</div>
				<div class="stat-info">
					<div class="stat-value">${data.visitsTotal}</div>
					<div class="stat-label">Визитов всего</div>
				</div>
			</div>
		`
	} catch (err) {
		grid.innerHTML = '<div class="loading-state">Ошибка загрузки</div>'
		toast('Ошибка загрузки сводки: ' + err.message, 'error')
	}
}

// ============================================================
// STATS
// ============================================================
let statsChartInstance = null

async function loadStats() {
	const tbody = document.getElementById('statsBody')
	if (tbody)
		tbody.innerHTML =
			'<tr><td colspan="2" class="empty-state">Загрузка...</td></tr>'
	try {
		const data = await http.get('/admin/stats')

		if (tbody) {
			if (!data || data.length === 0) {
				tbody.innerHTML =
					'<tr><td colspan="2" class="empty-state">Нет данных</td></tr>'
			} else {
				tbody.innerHTML = ''
				data.forEach(item => {
					const tr = document.createElement('tr')
					const dateObj = new Date(item.date)
					tr.innerHTML = `
						<td>${dateObj.toLocaleDateString('ru-RU')}</td>
						<td><strong>${item.visits}</strong></td>
					`
					tbody.appendChild(tr)
				})
			}
		}

		// Отрисовка графика (копируем массив для реверса)
		renderChart([...data].reverse())
	} catch (err) {
		if (tbody)
			tbody.innerHTML =
				'<tr><td colspan="2" class="empty-state">Ошибка загрузки</td></tr>'
		toast('Ошибка загрузки статистики: ' + err.message, 'error')
	}
}

function renderChart(data) {
	const canvas = document.getElementById('statsChart')
	if (!canvas) return
	const ctx = canvas.getContext('2d')

	if (statsChartInstance) {
		statsChartInstance.destroy()
	}

	const labels = data.map(d =>
		new Date(d.date).toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: 'short',
		}),
	)
	const values = data.map(d => d.visits)

	if (typeof Chart === 'undefined') return

	Chart.defaults.color = '#888'
	statsChartInstance = new Chart(ctx, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [
				{
					label: 'Визиты',
					data: values,
					borderColor: '#e63946',
					backgroundColor: 'rgba(230, 57, 70, 0.1)',
					borderWidth: 2,
					pointBackgroundColor: '#e63946',
					tension: 0.3,
					fill: true,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: {
					backgroundColor: '#16161a',
					titleColor: '#fff',
					bodyColor: '#f0f0f5',
					borderColor: 'rgba(255, 255, 255, 0.1)',
					borderWidth: 1,
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					grid: { color: 'rgba(255, 255, 255, 0.05)' },
				},
				x: {
					grid: { color: 'rgba(255, 255, 255, 0.05)' },
				},
			},
		},
	})
}

window.resetStats = () => {
	modal.confirm(
		'Сброс статистики',
		'Вы уверены, что хотите полностью сбросить статистику посещений?',
		async () => {
			try {
				await http.del('/stats')
				toast('Статистика сброшена', 'success')
				modal.close()
				loadStats()
			} catch (err) {
				toast('Ошибка сброса: ' + err.message, 'error')
			}
		},
	)
}

// ============================================================
// VIDEOS
// ============================================================
// Хранилище видео для навигации
let videosData = []

async function loadVideos() {
	const grid = document.getElementById('videosGrid')
	grid.innerHTML = '<div class="loading-state">Загрузка...</div>'
	try {
		videosData = await http.get('/videos')
		grid.innerHTML = ''
		if (!videosData.length) {
			grid.innerHTML = '<div class="loading-state">Видео не добавно</div>'
			return
		}
		videosData.forEach((v, idx) => {
			const card = document.createElement('div')
			card.className = 'media-card'
			card.dataset.id = v.id
			const isFirst = idx === 0
			const isLast = idx === videosData.length - 1
			card.innerHTML = `
				<div class="media-thumb media-thumb-video" onclick="previewVideo(${idx})">
					<span class="thumb-play">▶️</span>
					<div class="thumb-hover">Просмотр</div>
				</div>
				<div class="media-info">
					<div class="media-title">${v.title || 'Без названия'}</div>
					<div class="media-meta">Порядок: ${v.order ?? idx} &bull; ${v.category || ''}</div>
					<div class="media-actions">
						<button class="btn-icon" title="Вверх" ${isFirst ? 'disabled style="opacity:0.3"' : ''} onclick="moveVideo(${v.id}, -1)">↑</button>
						<button class="btn-icon" title="Вниз" ${isLast ? 'disabled style="opacity:0.3"' : ''} onclick="moveVideo(${v.id}, 1)">↓</button>
						<button class="btn-icon delete" title="Удалить" onclick="deleteVideo(${v.id})">🗑️</button>
					</div>
				</div>`
			grid.appendChild(card)
		})
	} catch (err) {
		grid.innerHTML = '<div class="loading-state">Ошибка загрузки</div>'
		toast('Ошибка загрузки видео: ' + err.message, 'error')
	}
}

window.previewVideo = idx => {
	const v = videosData[idx]
	if (!v) return
	const isLocal = v.url && !v.url.startsWith('http')
	const src = isLocal ? '/' + v.url : v.url || ''
	modal.open(
		v.title || 'Просмотр видео',
		isLocal
			? `<video controls style="width:100%;border-radius:8px;max-height:55vh" src="${src}"></video>
			   <p style="margin-top:8px;font-size:12px;color:var(--text-muted)">Файл: ${v.url}</p>`
			: `<div style="text-align:center;padding:20px">
					<a href="${src}" target="_blank" class="btn btn-primary">Открыть по ссылке ↗</a>
					<p style="margin-top:12px;font-size:12px;color:var(--text-muted)">${src}</p>
			   </div>`,
	)
}

window.moveVideo = async (id, dir) => {
	const idx = videosData.findIndex(v => v.id === id)
	if (idx < 0) return
	const swapIdx = idx + dir
	if (swapIdx < 0 || swapIdx >= videosData.length) return

	const temp = videosData[idx]
	videosData[idx] = videosData[swapIdx]
	videosData[swapIdx] = temp

	const orderPayload = videosData.map((v, i) => ({ id: v.id, order: i }))
	try {
		await http.post('/videos/reorder', { order: orderPayload })
		loadVideos()
	} catch {
		toast('Ошибка перемещения', 'error')
	}
}

window.deleteVideo = id => {
	modal.confirm('Удаление', 'Удалить это видео?', async () => {
		try {
			await http.del('/videos/' + id)
			toast('Видео удалено', 'success')
			modal.close()
			loadVideos()
		} catch {
			toast('Ошибка удаления', 'error')
		}
	})
}

function openAddVideoModal() {
	modal.open(
		'Добавить видео',
		`
    <div class="form-field">
      <label>Название</label>
      <input type="text" id="m_vid_title" placeholder="Название видео" />
    </div>
    <div class="form-field">
      <label>Категория</label>
      <select id="m_vid_cat">
        <option value="video_page">Страница Видео</option>
        <option value="gallery">Галерея / Главная</option>
      </select>
    </div>
    <div class="form-field">
      <label>Файл видео</label>
      <input type="file" id="m_vid_file" accept="video/*" />
    </div>
    <div class="form-field">
      <label>Или ссылка URL на видео</label>
      <input type="url" id="m_vid_url" placeholder="https://..." />
    </div>
    <hr style="border:0;border-top:1px solid var(--border);margin:15px 0;" />
    <div class="form-field">
      <label>Превью-картинка (опционально)</label>
      <input type="file" id="m_vid_preview_file" accept="image/*" />
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Если не загрузить, будет использован первый кадр видео.</div>
    </div>
    <div class="form-field">
      <label>Или URL картинки-превью</label>
      <input type="url" id="m_vid_preview_url" placeholder="https://..." />
    </div>
  `,
		async () => {
			const title = document.getElementById('m_vid_title').value.trim()
			const category = document.getElementById('m_vid_cat').value
			const file = document.getElementById('m_vid_file').files[0]
			const url = document.getElementById('m_vid_url').value.trim()
			const previewFile = document.getElementById('m_vid_preview_file').files[0]
			const previewUrl = document.getElementById('m_vid_preview_url').value.trim()

			if (!title) return toast('Введите название', 'error')
			if (!file && !url) return toast('Добавьте файл или ссылку на видео', 'error')
			
			try {
				const fd = new FormData()
				fd.append('title', title)
				fd.append('category', category)
				
				if (file) {
					fd.append('videoFile', file)
				} else {
					fd.append('url', url)
				}
				
				if (previewFile) {
					fd.append('previewFile', previewFile)
				} else if (previewUrl) {
					fd.append('preview_url', previewUrl)
				}
				
				// Мы всегда шлём FormData, если есть любой файл. Если файлов нет, http.post может отправить JSON, 
				// но поскольку multer.fields ждет FormData, безопаснее всегда слать FormData.
				await http.post('/videos', fd, true)
				
				toast('Видео добавлено', 'success')
				modal.close()
				loadVideos()
			} catch (err) {
				toast('Ошибка: ' + err.message, 'error')
			}
		},
	)
}

// ============================================================
// GALLERY
// ============================================================
// Хранилище фото
let galleryData = []

async function loadGallery() {
	const grid = document.getElementById('galleryGrid')
	grid.innerHTML = '<div class="loading-state">Загрузка...</div>'
	try {
		galleryData = await http.get('/gallery')
		grid.innerHTML = ''
		if (!galleryData.length) {
			grid.innerHTML = '<div class="loading-state">Фото не добавлено</div>'
			return
		}
		galleryData.forEach((p, idx) => {
			const card = document.createElement('div')
			card.className = 'media-card'
			card.dataset.id = p.id
			const imgSrc = p.image_url ? '/' + p.image_url : ''
			const isFirst = idx === 0
			const isLast = idx === galleryData.length - 1
			card.innerHTML = `
				<div class="media-thumb" onclick="previewPhoto(${idx})" style="cursor:pointer">
					${
						imgSrc
							? `<img src="${imgSrc}" alt="${p.title || ''}" onerror="this.parentElement.innerHTML='🖼️'" />`
							: '<span>🖼️</span>'
					}
					<div class="thumb-hover">Просмотр</div>
				</div>
				<div class="media-info">
					<div class="media-title">${p.title || 'Без названия'}</div>
					<div class="media-meta">Порядок: ${p.order ?? idx}</div>
					<div class="media-actions">
						<button class="btn-icon" title="Вверх" ${isFirst ? 'disabled style="opacity:0.3"' : ''} onclick="movePhoto(${p.id}, -1)">↑</button>
						<button class="btn-icon" title="Вниз" ${isLast ? 'disabled style="opacity:0.3"' : ''} onclick="movePhoto(${p.id}, 1)">↓</button>
						<button class="btn-icon delete" title="Удалить" onclick="deletePhoto(${p.id})">🗑️</button>
					</div>
				</div>`
			grid.appendChild(card)
		})
	} catch {
		grid.innerHTML = '<div class="loading-state">Ошибка загрузки</div>'
		toast('Ошибка загрузки галереи', 'error')
	}
}

window.previewPhoto = idx => {
	const p = galleryData[idx]
	if (!p || !p.image_url) return
	modal.open(
		p.title || 'Фото',
		`<img src="/${p.image_url}" alt="${p.title || ''}" style="width:100%;border-radius:8px;max-height:60vh;object-fit:contain" />`,
	)
}

window.movePhoto = async (id, dir) => {
	const idx = galleryData.findIndex(p => p.id === id)
	if (idx < 0) return
	const swapIdx = idx + dir
	if (swapIdx < 0 || swapIdx >= galleryData.length) return

	const temp = galleryData[idx]
	galleryData[idx] = galleryData[swapIdx]
	galleryData[swapIdx] = temp

	const orderPayload = galleryData.map((p, i) => ({ id: p.id, order: i }))
	try {
		await http.post('/gallery/reorder', { order: orderPayload })
		loadGallery()
	} catch {
		toast('Ошибка перемещения', 'error')
	}
}

window.deletePhoto = id => {
	modal.confirm('Удаление', 'Удалить это фото?', async () => {
		try {
			await http.del('/gallery/' + id)
			toast('Фото удалено', 'success')
			modal.close()
			loadGallery()
		} catch {
			toast('Ошибка удаления', 'error')
		}
	})
}

function openAddGalleryModal() {
	modal.open(
		'Добавить фото',
		`
    <div class="form-field">
      <label>Описание (alt)</label>
      <input type="text" id="m_gal_title" placeholder="Описание фото" />
    </div>
    <div class="form-field">
      <label>Файл изображения *</label>
      <input type="file" id="m_gal_file" accept="image/*" />
    </div>
  `,
		async () => {
			const title = document.getElementById('m_gal_title').value.trim()
			const file = document.getElementById('m_gal_file').files[0]
			if (!file) return toast('Выберите файл', 'error')
			try {
				const fd = new FormData()
				fd.append('title', title || 'Фото')
				fd.append('imageFile', file)
				await http.post('/gallery', fd, true)
				toast('Фото добавлено', 'success')
				modal.close()
				loadGallery()
			} catch (err) {
				toast('Ошибка: ' + err.message, 'error')
			}
		},
	)
}

// ============================================================
// TEXTS (by blocks)
// ============================================================
let textsData = {}

async function loadTexts() {
	const lang = document.getElementById('textLang').value
	try {
		textsData = await http.get('/translations/' + lang)
		fillTextBlocks()
	} catch {
		toast('Ошибка загрузки текстов', 'error')
	}
}

function getNestedVal(obj, path) {
	return path
		.split('.')
		.reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), obj)
}

function fillTextBlocks() {
	document.querySelectorAll('.field-input[data-key]').forEach(input => {
		const val = getNestedVal(textsData, input.dataset.key)
		input.value = val || ''
	})
}

async function saveTexts() {
	const lang = document.getElementById('textLang').value
	// Собираем изменения в объект
	const updated = JSON.parse(JSON.stringify(textsData)) // deep clone
	document.querySelectorAll('.field-input[data-key]').forEach(input => {
		const keys = input.dataset.key.split('.')
		let ref = updated
		for (let i = 0; i < keys.length - 1; i++) {
			if (!ref[keys[i]]) ref[keys[i]] = {}
			ref = ref[keys[i]]
		}
		ref[keys[keys.length - 1]] = input.value
	})
	try {
		await http.post('/translations/' + lang, updated)
		textsData = updated
		toast('Тексты сохранены ✓', 'success')
	} catch (err) {
		toast('Ошибка сохранения: ' + err.message, 'error')
	}
}

function initTextBlocks() {
	document.querySelectorAll('.block-header').forEach(header => {
		const targetId = header.dataset.toggle
		const body = document.getElementById(targetId)
		if (!body) return
		body.classList.add('hidden') // начинаем свёрнутыми
		header.classList.add('collapsed')
		header.addEventListener('click', () => {
			const isHidden = body.classList.toggle('hidden')
			header.classList.toggle('collapsed', isHidden)
		})
	})
	document.getElementById('textLang').addEventListener('change', loadTexts)
	document.getElementById('saveTextsBtn').addEventListener('click', saveTexts)
}

// ============================================================
// SOCIAL LINKS
// ============================================================
let socialLinks = []

async function loadSocial() {
	const list = document.getElementById('socialList')
	list.innerHTML = '<div class="loading-state">Загрузка...</div>'
	try {
		socialLinks = await http.get('/social-links')
		renderSocialList()
	} catch {
		list.innerHTML = '<div class="loading-state">Ошибка загрузки</div>'
		toast('Ошибка загрузки соцсетей', 'error')
	}
}

function renderSocialList() {
	const list = document.getElementById('socialList')
	list.innerHTML = ''
	if (!socialLinks.length) {
		list.innerHTML = '<div class="loading-state">Нет соцсетей</div>'
		return
	}
	socialLinks.forEach(link => {
		const item = document.createElement('div')
		item.className = 'list-item'
		item.innerHTML = `
      <span class="list-item-icon">${link.icon || '🔗'}</span>
      <div class="list-item-info">
        <div class="list-item-title">${link.name || link.platform || 'Соцсеть'}</div>
        <div class="list-item-sub">${link.url || ''}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn-icon" title="Редактировать" onclick="editSocial(${link.id})">✏️</button>
        <button class="btn-icon delete" title="Удалить" onclick="deleteSocial(${link.id})">🗑️</button>
      </div>`
		list.appendChild(item)
	})
}

function socialModalForm(link = {}) {
	return `
    <div class="form-field">
      <label>Название платформы</label>
      <input type="text" id="m_soc_name" value="${link.name || link.platform || ''}" placeholder="Instagram, Telegram..." />
    </div>
    <div class="form-field">
      <label>Ссылка URL</label>
      <input type="url" id="m_soc_url" value="${link.url || ''}" placeholder="https://..." />
    </div>
    <div class="form-field">
      <label>Иконка (emoji или текст)</label>
      <input type="text" id="m_soc_icon" value="${link.icon || ''}" placeholder="📸" />
    </div>`
}

function openAddSocialModal() {
	modal.open('Добавить соцсеть', socialModalForm(), async () => {
		const data = {
			name: document.getElementById('m_soc_name').value.trim(),
			platform: document.getElementById('m_soc_name').value.trim(),
			url: document.getElementById('m_soc_url').value.trim(),
			icon: document.getElementById('m_soc_icon').value.trim(),
			isActive: true,
		}
		if (!data.url) return toast('Введите ссылку', 'error')
		try {
			await http.post('/social-links', data)
			toast('Соцсеть добавлена', 'success')
			modal.close()
			loadSocial()
		} catch (err) {
			toast('Ошибка: ' + err.message, 'error')
		}
	})
}

window.editSocial = id => {
	const link = socialLinks.find(l => l.id === id)
	if (!link) return
	modal.open('Редактировать соцсеть', socialModalForm(link), async () => {
		const data = {
			name: document.getElementById('m_soc_name').value.trim(),
			platform: document.getElementById('m_soc_name').value.trim(),
			url: document.getElementById('m_soc_url').value.trim(),
			icon: document.getElementById('m_soc_icon').value.trim(),
		}
		try {
			await http.put('/social-links/' + id, data)
			toast('Сохранено', 'success')
			modal.close()
			loadSocial()
		} catch (err) {
			toast('Ошибка: ' + err.message, 'error')
		}
	})
}

window.deleteSocial = id => {
	modal.confirm('Удаление', 'Удалить эту соцсеть?', async () => {
		try {
			await http.del('/social-links/' + id)
			toast('Удалено', 'success')
			modal.close()
			loadSocial()
		} catch {
			toast('Ошибка удаления', 'error')
		}
	})
}

// ============================================================
// SETTINGS
// ============================================================
async function loadSettings() {
	try {
		// Загрузка общих настроек
		const settings = await http.get('/settings')
		const setVal = (id, key) => {
			const el = document.getElementById(id)
			if (el && settings[key] !== undefined && settings[key] !== null) el.value = settings[key]
		}
		setVal('video_bg_url', 'video_page_bg')
		setVal('video_bg_start', 'video_bg_start')
		setVal('video_bg_end', 'video_bg_end')
		setVal('gallery_bg_url', 'gallery_page_bg')
		setVal('gallery_bg_start', 'gallery_bg_start')
		setVal('gallery_bg_end', 'gallery_bg_end')
		setVal('gallery_bg_pos_x', 'gallery_bg_pos_x')
		setVal('gallery_bg_pos_y', 'gallery_bg_pos_y')

		// Фото биографии
		const bioPUrl = settings['bio_photo']
		if (bioPUrl) {
			const urlInput = document.getElementById('bio_photo_url')
			if (urlInput) urlInput.value = bioPUrl
			const preview = document.getElementById('bio_photo_preview')
			const previewImg = document.getElementById('bio_photo_preview_img')
			if (preview && previewImg) {
				previewImg.src = bioPUrl
				preview.style.display = 'block'
			}
		}

		// Фон блока Биографии
		const bioBgUrl = settings['bio_bg_photo']
		if (bioBgUrl) {
			const urlInput = document.getElementById('bio_bg_photo_url')
			if (urlInput) urlInput.value = bioBgUrl
			const preview = document.getElementById('bio_bg_photo_preview')
			const previewImg = document.getElementById('bio_bg_photo_preview_img')
			if (preview && previewImg) {
				previewImg.src = bioBgUrl
				preview.style.display = 'block'
			}
		}

		// Фон блока Шоу
		const showBgUrl = settings['show_bg_photo']
		if (showBgUrl) {
			const urlInput = document.getElementById('show_bg_photo_url')
			if (urlInput) urlInput.value = showBgUrl
			const preview = document.getElementById('show_bg_photo_preview')
			const previewImg = document.getElementById('show_bg_photo_preview_img')
			if (preview && previewImg) {
				previewImg.src = showBgUrl
				preview.style.display = 'block'
			}
		}

		// Фон блока Галереи
		const galleryBgUrl = settings['gallery_bg_photo']
		if (galleryBgUrl) {
			const urlInput = document.getElementById('gallery_bg_photo_url')
			if (urlInput) urlInput.value = galleryBgUrl
			const preview = document.getElementById('gallery_bg_photo_preview')
			const previewImg = document.getElementById('gallery_bg_photo_preview_img')
			if (preview && previewImg) {
				previewImg.src = galleryBgUrl
				preview.style.display = 'block'
			}
		}


		// Медиа Шоу
		const showUrl = settings['show_media_url']
		const showType = settings['show_media_type'] || 'image' // image or video
		if (showUrl) {
			const sUrlInp = document.getElementById('show_media_url')
			if (sUrlInp) sUrlInp.value = showUrl
			
			const preview = document.getElementById('show_media_preview')
			const pImg = document.getElementById('show_media_preview_img')
			const pVid = document.getElementById('show_media_preview_video')
			
			if (preview) preview.style.display = 'block'
			if (showType === 'video' && pVid) {
				pVid.src = showUrl
				pVid.style.display = 'block'
				if (pImg) pImg.style.display = 'none'
			} else if (pImg) {
				pImg.src = showUrl
				pImg.style.display = 'block'
				if (pVid) pVid.style.display = 'none'
			}
		}

		// Превью для видео Шоу
		const showPreviewUrl = settings['show_media_preview_url']
		if (showPreviewUrl) {
			const sPUrlInp = document.getElementById('show_media_preview_url_input')
			if (sPUrlInp) sPUrlInp.value = showPreviewUrl
			
			const previewP = document.getElementById('show_media_preview_poster')
			const previewPImg = document.getElementById('show_media_preview_poster_img')
			if (previewP && previewPImg) {
				previewPImg.src = showPreviewUrl
				previewP.style.display = 'block'
			}
		}

		// Галерея превью фото
		const galleryUrl = settings['gallery_media_url']
		if (galleryUrl) {
			const gUrlInp = document.getElementById('gallery_media_url')
			if (gUrlInp) gUrlInp.value = galleryUrl
			const preview = document.getElementById('gallery_media_preview')
			const previewImg = document.getElementById('gallery_media_preview_img')
			if (preview && previewImg) {
				previewImg.src = galleryUrl
				preview.style.display = 'block'
			}
		}

		// Превью видео первый кадр
		const videoPreviewCb = document.getElementById('video_preview_first_frame')
		if (videoPreviewCb) {
			videoPreviewCb.checked = settings['video_preview_first_frame'] === 'true'
		}

		// Кнопка билетов
		const ticket = await http.get('/ticket-link')
		if (ticket.url) document.getElementById('ticket_url').value = ticket.url
		if (ticket.label)
			document.getElementById('ticket_label').value = ticket.label
		document.getElementById('ticket_active').checked = ticket.isActive !== false
	} catch (err) {
		toast('Ошибка загрузки настроек', 'error')
	}
}

async function saveBioPhoto() {
	try {
		const file = document.getElementById('bio_photo_file')?.files[0]
		let url = document.getElementById('bio_photo_url')?.value.trim() || ''

		if (file) {
			const fd = new FormData()
			fd.append('file', file)
			const res = await http.post('/upload', fd, true)
			url = res.url
			document.getElementById('bio_photo_url').value = url
		}

		await http.post('/settings', { bio_photo: url })

		// Обновить превью
		const preview = document.getElementById('bio_photo_preview')
		const previewImg = document.getElementById('bio_photo_preview_img')
		if (preview && previewImg && url) {
			previewImg.src = url
			preview.style.display = 'block'
		}

		toast('Фото биографии сохранено ✓', 'success')
	} catch (err) {
		toast('Ошибка сохранения фото: ' + err.message, 'error')
	}
}

async function saveBioBgPhoto() {
	try {
		const file = document.getElementById('bio_bg_photo_file')?.files[0]
		let url = document.getElementById('bio_bg_photo_url')?.value.trim() || ''

		if (file) {
			const fd = new FormData()
			fd.append('file', file)
			const res = await http.post('/upload', fd, true)
			url = res.url
			const urlInp = document.getElementById('bio_bg_photo_url')
			if (urlInp) urlInp.value = url
		}

		await http.post('/settings', { bio_bg_photo: url })

		const preview = document.getElementById('bio_bg_photo_preview')
		const previewImg = document.getElementById('bio_bg_photo_preview_img')
		if (preview && previewImg && url) {
			previewImg.src = url
			preview.style.display = 'block'
		}

		toast('Фон биографии сохранён ✓', 'success')
	} catch (err) {
		toast('Ошибка сохранения фона: ' + err.message, 'error')
	}
}

async function saveShowBgPhoto() {
	try {
		const file = document.getElementById('show_bg_photo_file')?.files[0]
		let url = document.getElementById('show_bg_photo_url')?.value.trim() || ''

		if (file) {
			const fd = new FormData()
			fd.append('file', file)
			const res = await http.post('/upload', fd, true)
			url = res.url
			const urlInp = document.getElementById('show_bg_photo_url')
			if (urlInp) urlInp.value = url
		}

		await http.post('/settings', { show_bg_photo: url })

		const preview = document.getElementById('show_bg_photo_preview')
		const previewImg = document.getElementById('show_bg_photo_preview_img')
		if (preview && previewImg && url) {
			previewImg.src = url
			preview.style.display = 'block'
		}

		toast('Фон «Шоу» сохранён ✓', 'success')
	} catch (err) {
		toast('Ошибка сохранения фона: ' + err.message, 'error')
	}
}

async function saveGalleryBgPhoto() {
	try {
		const file = document.getElementById('gallery_bg_photo_file')?.files[0]
		let url = document.getElementById('gallery_bg_photo_url')?.value.trim() || ''

		if (file) {
			const fd = new FormData()
			fd.append('file', file)
			const res = await http.post('/upload', fd, true)
			url = res.url
			const urlInp = document.getElementById('gallery_bg_photo_url')
			if (urlInp) urlInp.value = url
		}

		await http.post('/settings', { gallery_bg_photo: url })

		const preview = document.getElementById('gallery_bg_photo_preview')
		const previewImg = document.getElementById('gallery_bg_photo_preview_img')
		if (preview && previewImg && url) {
			previewImg.src = url
			preview.style.display = 'block'
		}

		toast('Фон «Галерея» сохранён ✓', 'success')
	} catch (err) {
		toast('Ошибка сохранения фона: ' + err.message, 'error')
	}
}

async function saveShowMedia() {
	try {
		const file = document.getElementById('show_media_file')?.files[0]
		let url = document.getElementById('show_media_url')?.value.trim() || ''
		let type = 'image'

		if (file) {
			const fd = new FormData()
			fd.append('file', file)
			const res = await http.post('/upload', fd, true)
			url = res.url
			document.getElementById('show_media_url').value = url
		}

		if (url.match(/\.(mp4|webm|ogg)$/i) || (file && file.type.startsWith('video/'))) {
			type = 'video'
		}

		await http.post('/settings', { 
			show_media_url: url,
			show_media_type: type
		})

		const preview = document.getElementById('show_media_preview')
		const pImg = document.getElementById('show_media_preview_img')
		const pVid = document.getElementById('show_media_preview_video')
		
		if (preview && url) {
			preview.style.display = 'block'
			if (type === 'video') {
				if(pVid) { pVid.src = url; pVid.style.display = 'block'; }
				if(pImg) { pImg.style.display = 'none'; }
			} else {
				if(pImg) { pImg.src = url; pImg.style.display = 'block'; }
				if(pVid) { pVid.style.display = 'none'; }
			}
		}

		toast('Медиа для "Шоу" сохранено ✓', 'success')
	} catch (err) {
		toast('Ошибка сохранения медиа: ' + err.message, 'error')
	}
}

async function saveShowMediaPreview() {
	try {
		const file = document.getElementById('show_media_preview_file')?.files[0]
		let url = document.getElementById('show_media_preview_url_input')?.value.trim() || ''

		if (file) {
			const fd = new FormData()
			fd.append('file', file)
			const res = await http.post('/upload', fd, true)
			url = res.url
			document.getElementById('show_media_preview_url_input').value = url
		}

		await http.post('/settings', { 
			show_media_preview_url: url
		})

		const preview = document.getElementById('show_media_preview_poster')
		const pImg = document.getElementById('show_media_preview_poster_img')
		
		if (preview && url) {
			preview.style.display = 'block'
			if(pImg) { pImg.src = url; pImg.style.display = 'block'; }
		}

		toast('Превью (Постер) для "Шоу" сохранено ✓', 'success')
	} catch (err) {
		toast('Ошибка сохранения превью: ' + err.message, 'error')
	}
}

async function saveGalleryMedia() {
	try {
		const file = document.getElementById('gallery_media_file')?.files[0]
		let url = document.getElementById('gallery_media_url')?.value.trim() || ''

		if (file) {
			const fd = new FormData()
			fd.append('file', file)
			const res = await http.post('/upload', fd, true)
			url = res.url
			document.getElementById('gallery_media_url').value = url
		}

		await http.post('/settings', { gallery_media_url: url })

		const preview = document.getElementById('gallery_media_preview')
		const previewImg = document.getElementById('gallery_media_preview_img')
		if (preview && previewImg && url) {
			previewImg.src = url
			preview.style.display = 'block'
		}

		toast('Медиа для "Галерея" сохранено ✓', 'success')
	} catch (err) {
		toast('Ошибка сохранения медиа: ' + err.message, 'error')
	}
}

async function saveBackgrounds() {
	try {
		const videoFile = document.getElementById('video_bg_file').files[0]
		const galleryFile = document.getElementById('gallery_bg_file').files[0]

		let videoUrl = document.getElementById('video_bg_url').value.trim()
		let galleryUrl = document.getElementById('gallery_bg_url').value.trim()

		// Загрузка файлов если выбраны
		if (videoFile) {
			const fd = new FormData()
			fd.append('file', videoFile)
			const res = await http.post('/upload', fd, true)
			videoUrl = res.url
			document.getElementById('video_bg_url').value = videoUrl
		}

		if (galleryFile) {
			const fd = new FormData()
			fd.append('file', galleryFile)
			const res = await http.post('/upload', fd, true)
			galleryUrl = res.url
			document.getElementById('gallery_bg_url').value = galleryUrl
		}

		const getNum = id => {
			const el = document.getElementById(id)
			return el && el.value !== '' ? el.value : ''
		}

		// Сохраняем все настройки фона
		await http.post('/settings', {
			video_page_bg: videoUrl,
			video_bg_start: getNum('video_bg_start'),
			video_bg_end: getNum('video_bg_end'),
			gallery_page_bg: galleryUrl,
			gallery_bg_start: getNum('gallery_bg_start'),
			gallery_bg_end: getNum('gallery_bg_end'),
			gallery_bg_pos_x: getNum('gallery_bg_pos_x'),
			gallery_bg_pos_y: getNum('gallery_bg_pos_y'),
		})

		toast('Фоны успешно сохранены', 'success')
	} catch (err) {
		toast('Ошибка сохранения фонов: ' + err.message, 'error')
	}
}


async function saveTicket() {
	const data = {
		url: document.getElementById('ticket_url').value.trim(),
		label:
			document.getElementById('ticket_label').value.trim() || 'Купить билеты',
		isActive: document.getElementById('ticket_active').checked,
	}
	try {
		await http.post('/ticket-link', data)
		toast('Кнопка билетов сохранена', 'success')
	} catch (err) {
		toast('Ошибка: ' + err.message, 'error')
	}
}

function downloadBackup() {
	const a = document.createElement('a')
	a.href = '/api/backup'
	a.download = 'juggler_backup.sqlite'
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	toast('Скачивание резервной копии...', 'info')
}

// ============================================================
// CRM
// ============================================================
let allCRM = []
let activeCRMFilter = 'all'

async function loadCRM() {
	const tbody = document.getElementById('crmBody')
	tbody.innerHTML =
		'<tr><td colspan="6" class="empty-state">Загрузка...</td></tr>'
	try {
		allCRM = await http.get('/contact-forms')
		updateCRMBadge()
		renderCRM()
	} catch {
		tbody.innerHTML =
			'<tr><td colspan="6" class="empty-state">Ошибка загрузки</td></tr>'
		toast('Ошибка загрузки заявок', 'error')
	}
}

function updateCRMBadge() {
	const badge = document.getElementById('crmBadge')
	const count = allCRM.filter(r => r.status === 'new').length
	badge.textContent = count
	badge.style.display = count ? '' : 'none'
}

function renderCRM() {
	const tbody = document.getElementById('crmBody')
	const list =
		activeCRMFilter === 'all'
			? allCRM
			: allCRM.filter(r => r.status === activeCRMFilter)
	if (!list.length) {
		tbody.innerHTML =
			'<tr><td colspan="6" class="empty-state">Заявок нет</td></tr>'
		return
	}
	tbody.innerHTML = ''
	list.forEach(req => {
		const tr = document.createElement('tr')
		const date = req.createdAt
			? new Date(req.createdAt).toLocaleString('ru-RU')
			: '—'
		tr.innerHTML = `
      <td><span class="status-badge status-${req.status || 'new'}">${req.status === 'read' ? 'Прочитано' : 'Новая'}</span></td>
      <td>${date}</td>
      <td><strong>${req.firstName || ''} ${req.lastName || ''}</strong></td>
      <td>${req.phone || '—'}</td>
      <td>${req.subject || '—'}</td>
      <td>
        <button class="btn-icon" title="Просмотреть" onclick="viewCRM(${req.id})">👁️</button>
        <button class="btn-icon delete" title="Удалить" onclick="deleteCRM(${req.id})">🗑️</button>
      </td>`
		tbody.appendChild(tr)
	})
}

window.viewCRM = async id => {
	const req = allCRM.find(r => r.id === id)
	if (!req) return
	modal.open(
		'Заявка №' + req.id,
		`
    <div class="form-field">
      <label>От кого</label>
      <p>${req.firstName || ''} ${req.lastName || ''}</p>
    </div>
    <div class="form-field">
      <label>Телефон</label>
      <p><a href="tel:${req.phone}" style="color:var(--accent)">${req.phone || '—'}</a></p>
    </div>
    <div class="form-field">
      <label>Email</label>
      <p><a href="mailto:${req.email}" style="color:var(--accent)">${req.email || '—'}</a></p>
    </div>
    <div class="form-field">
      <label>Тема</label>
      <p>${req.subject || '—'}</p>
    </div>
    ${req.message ? `<div class="form-field"><label>Сообщение</label><p style="white-space:pre-wrap;background:rgba(255,255,255,0.04);padding:12px;border-radius:8px;">${req.message}</p></div>` : ''}
  `,
	)
	// Отмечаем как прочитанное
	if (req.status === 'new') {
		try {
			await http.put('/contact-forms/' + id, { status: 'read' })
			req.status = 'read'
			updateCRMBadge()
			renderCRM()
		} catch {}
	}
}

window.deleteCRM = id => {
	modal.confirm('Удаление', 'Удалить заявку?', async () => {
		try {
			await http.del('/contact-forms/' + id)
			allCRM = allCRM.filter(r => r.id !== id)
			updateCRMBadge()
			renderCRM()
			toast('Заявка удалена', 'success')
			modal.close()
		} catch {
			toast('Ошибка удаления', 'error')
		}
	})
}

// ============================================================
// SECURITY
// ============================================================
async function loadSecurity() {
	const tbody = document.getElementById('logsBody')
	tbody.innerHTML =
		'<tr><td colspan="4" class="empty-state">Загрузка...</td></tr>'
	try {
		const logs = await http.get('/auth/login-logs')
		if (!logs.length) {
			tbody.innerHTML =
				'<tr><td colspan="4" class="empty-state">Входов не зафиксировано</td></tr>'
			return
		}
		tbody.innerHTML = ''
		logs.forEach(log => {
			const tr = document.createElement('tr')
			const date = log.createdAt
				? new Date(log.createdAt).toLocaleString('ru-RU')
				: '—'
			const ua = log.userAgent || ''
			const browser = parseUA(ua)
			const isSuccess = log.status === 'success'
			tr.innerHTML = `
				<td><span class="status-badge ${isSuccess ? 'status-read' : 'status-new'}">
					${isSuccess ? '✅ Успех' : '❌ Ошибка'}
				</span></td>
				<td>${date}</td>
				<td><code style="font-size:12px">${log.ip || '—'}</code></td>
				<td style="font-size:12px;color:var(--text-muted)">${browser}</td>`
			tbody.appendChild(tr)
		})
	} catch {
		tbody.innerHTML =
			'<tr><td colspan="4" class="empty-state">Ошибка загрузки логов</td></tr>'
	}
}

function parseUA(ua) {
	if (!ua) return '—'
	if (ua.includes('Chrome')) return 'Chrome'
	if (ua.includes('Firefox')) return 'Firefox'
	if (ua.includes('Safari')) return 'Safari'
	if (ua.includes('Edge')) return 'Edge'
	if (ua.includes('curl')) return 'curl / API'
	return ua.slice(0, 50)
}

async function changePassword() {
	const cur = document.getElementById('cur_pass').value
	const nw = document.getElementById('new_pass').value
	const rep = document.getElementById('rep_pass').value
	if (!cur || !nw || !rep) return toast('Заполните все поля', 'error')
	if (nw !== rep) return toast('Пароли не совпадают', 'error')
	if (nw.length < 6) return toast('Минимум 6 символов', 'error')
	try {
		const r = await fetch('/api/auth/change-password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
		})
		const data = await r.json()
		if (!r.ok) return toast('Ошибка: ' + data.error, 'error')
		toast('Пароль изменён ✓', 'success')
		document.getElementById('cur_pass').value = ''
		document.getElementById('new_pass').value = ''
		document.getElementById('rep_pass').value = ''
	} catch (err) {
		toast('Ошибка запроса', 'error')
	}
}

async function clearLoginLogs() {
	modal.confirm(
		'Подтверждение',
		'Полностью очистить историю входов?',
		async () => {
			try {
				const r = await fetch('/api/auth/login-logs', { method: 'DELETE' })
				if (!r.ok) throw new Error()
				toast('Логи очищены', 'success')
				modal.close()
				loadSecurity()
			} catch {
				toast('Ошибка', 'error')
			}
		},
	)
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
	modal.init()
	initNav()
	initTextBlocks()

	// Медиа
	document
		.getElementById('addVideoBtn')
		.addEventListener('click', openAddVideoModal)
	document
		.getElementById('addGalleryBtn')
		.addEventListener('click', openAddGalleryModal)
	document
		.getElementById('addSocialBtn')
		.addEventListener('click', openAddSocialModal)

	// Настройки
	document.getElementById('saveBackgroundsBtn').addEventListener('click', saveBackgrounds)
	document.getElementById('saveTicketBtn').addEventListener('click', saveTicket)
	document.getElementById('saveBioPhotoBtn').addEventListener('click', saveBioPhoto)
	document.getElementById('saveBioBgPhotoBtn')?.addEventListener('click', saveBioBgPhoto)
	document.getElementById('saveShowBgPhotoBtn')?.addEventListener('click', saveShowBgPhoto)
	document.getElementById('saveGalleryBgPhotoBtn')?.addEventListener('click', saveGalleryBgPhoto)
	document.getElementById('saveShowMediaBtn')?.addEventListener('click', saveShowMedia)
	document.getElementById('saveShowMediaPreviewBtn')?.addEventListener('click', saveShowMediaPreview)
	document.getElementById('saveGalleryMediaBtn')?.addEventListener('click', saveGalleryMedia)
	document.getElementById('backupBtn').addEventListener('click', downloadBackup)

	// Авто-сохранение настройки превью видео
	document.getElementById('video_preview_first_frame')?.addEventListener('change', async (e) => {
		try {
			await http.post('/settings', { video_preview_first_frame: e.target.checked ? 'true' : 'false' })
			toast('Настройка превью видео сохранена', 'success')
		} catch (err) {
			toast('Ошибка сохранения: ' + err.message, 'error')
		}
	})

	// Безопасность
	document
		.getElementById('changePassBtn')
		.addEventListener('click', changePassword)
	document
		.getElementById('clearLogsBtn')
		.addEventListener('click', clearLoginLogs)

	// CRM фильтры
	document.querySelectorAll('.filter-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			document
				.querySelectorAll('.filter-btn')
				.forEach(b => b.classList.remove('active'))
			btn.classList.add('active')
			activeCRMFilter = btn.dataset.filter
			renderCRM()
		})
	})
})
