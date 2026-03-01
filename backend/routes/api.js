const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const {
	Video,
	Gallery,
	Event,
	Setting,
	Contact,
	FooterLink,
	SiteStat,
	ContactForm,
	SocialLink,
	TicketLink,
} = require('../database')
const { authenticateToken } = require('../middleware/auth')

// Configure Multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		let uploadPath = 'uploads/'
		if (req.path.includes('videos')) uploadPath += 'videos/'
		else if (req.path.includes('gallery')) uploadPath += 'gallery/'
		else if (req.path.includes('events')) uploadPath += 'events/'
		else uploadPath += 'misc/'

		// Create directory if it doesn't exist
		const fullPath = path.join(__dirname, '../../', uploadPath)
		if (!fs.existsSync(fullPath)) {
			fs.mkdirSync(fullPath, { recursive: true })
		}
		cb(null, fullPath)
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
		cb(null, uniqueSuffix + path.extname(file.originalname))
	},
})

const upload = multer({ storage: storage })

// Helper to get relative path
const getRelativePath = file => {
	if (!file) return null
	// Remove absolute path part, usually simplified to 'uploads/TYPE/filename'
	// This depends on how we serve static files. In server.js we do: app.use('/uploads', ...)
	// So we want to store 'uploads/videos/xyz.mp4' or just 'videos/xyz.mp4' if we mount specific routes.
	// Let's store relative to root for flexibility: 'uploads/videos/xyz.mp4'
	const fullPath = file.path
	const rootDir = path.join(__dirname, '../../')
	return path.relative(rootDir, fullPath).replace(/\\/g, '/')
}

// --- FILE UPLOAD ROUTE (FOR SETTINGS) ---
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' })
		}
		const relativePath = getRelativePath(req.file)
		res.json({ url: relativePath })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// --- VIDEOS ROUTES ---

// Get all videos
router.get('/videos', async (req, res) => {
	try {
		const videos = await Video.findAll({
			order: [
				['order', 'ASC'],
				['createdAt', 'DESC'],
			],
		})
		res.json(videos)
	} catch (err) {
		console.error('Ошибка API /videos:', err)
		res.status(500).json({ error: err.message })
	}
})

// Add video
router.post(
	'/videos',
	authenticateToken,
	upload.fields([{ name: 'videoFile', maxCount: 1 }, { name: 'previewFile', maxCount: 1 }]),
	async (req, res) => {
		try {
			const { title, description, duration, url, preview_url, category, crop_data, order } =
				req.body
			let videoUrl = url
			let finalPreviewUrl = preview_url

			// If file uploaded, use its path
			if (req.files && req.files['videoFile']) {
				videoUrl = getRelativePath(req.files['videoFile'][0])
			}
			if (req.files && req.files['previewFile']) {
				finalPreviewUrl = getRelativePath(req.files['previewFile'][0])
			}

			const video = await Video.create({
				title,
				description,
				duration,
				url: videoUrl,
				preview_url: finalPreviewUrl || null,
				category: category || 'video_page',
				crop_data: crop_data || null,
				order: order || 0,
			})
			res.status(201).json(video)
		} catch (err) {
			res.status(400).json({ error: err.message })
		}
	},
)

// Update video
router.put(
	'/videos/:id',
	authenticateToken,
	upload.fields([{ name: 'videoFile', maxCount: 1 }, { name: 'previewFile', maxCount: 1 }]),
	async (req, res) => {
		try {
			const { title, description, duration, url, preview_url, category, crop_data, order } =
				req.body
			const video = await Video.findByPk(req.params.id)

			if (!video) return res.status(404).json({ error: 'Video not found' })

			const updateData = { title, description, duration }
			
			if (req.files && req.files['videoFile']) {
				updateData.url = getRelativePath(req.files['videoFile'][0])
			} else if (url !== undefined) {
				updateData.url = url
			}

			if (req.files && req.files['previewFile']) {
				updateData.preview_url = getRelativePath(req.files['previewFile'][0])
			} else if (preview_url !== undefined) {
				updateData.preview_url = preview_url
			}

			if (category) updateData.category = category
			if (crop_data !== undefined) updateData.crop_data = crop_data
			if (order !== undefined) updateData.order = order

			await video.update(updateData)
			res.json(video)
		} catch (err) {
			res.status(400).json({ error: err.message })
		}
	},
)

// Delete video
router.delete('/videos/:id', authenticateToken, async (req, res) => {
	try {
		const video = await Video.findByPk(req.params.id)
		if (!video) return res.status(404).json({ error: 'Video not found' })
		await video.destroy()
		res.json({ message: 'Video deleted' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// Reorder videos
router.post('/videos/reorder', authenticateToken, async (req, res) => {
	try {
		const { order } = req.body // Expect array of { id, order }
		if (!Array.isArray(order)) {
			return res.status(400).json({ error: 'Order must be an array' })
		}

		const promises = order.map(item => {
			return Video.update({ order: item.order }, { where: { id: item.id } })
		})

		await Promise.all(promises)
		res.json({ message: 'Order updated' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// --- GALLERY ROUTES ---

router.get('/gallery', async (req, res) => {
	try {
		const items = await Gallery.findAll({
			order: [
				['order', 'ASC'],
				['createdAt', 'DESC'],
			],
		})
		res.json(items)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// POST Gallery Item
router.post(
	'/gallery',
	authenticateToken,
	upload.single('imageFile'),
	async (req, res) => {
		try {
			const { title, description, bg_gradient, crop_data, order } = req.body
			let imageUrl = null
			let background_gradient = bg_gradient || null

			if (req.file) {
				imageUrl = getRelativePath(req.file)
			} else if (!bg_gradient) {
				// Require either image or gradient
				return res.status(400).json({ error: 'Image or gradient required' })
			}

			// Auto-generate title if missing
			const finalTitle =
				title ||
				`Фото ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`

			const item = await Gallery.create({
				title: finalTitle,
				description,
				image_url: imageUrl,
				background_gradient,
				crop_data, // Save crop data
				order: order || 0,
			})
			res.status(201).json(item)
		} catch (err) {
			res.status(400).json({ error: err.message })
		}
	},
)

// PUT (Update) Gallery Item
router.put(
	'/gallery/:id',
	authenticateToken,
	upload.single('imageFile'),
	async (req, res) => {
		try {
			const item = await Gallery.findByPk(req.params.id)
			if (!item) return res.status(404).json({ error: 'Item not found' })

			const { title, description, crop_data, order } = req.body
			let updateData = { title, description }

			if (crop_data !== undefined) {
				updateData.crop_data = crop_data
			}

			if (order !== undefined) {
				updateData.order = order
			}

			if (req.file) {
				const imageUrl = getRelativePath(req.file)
				updateData.image_url = imageUrl
			}

			await item.update(updateData)
			res.json(item)
		} catch (err) {
			res.status(400).json({ error: err.message })
		}
	},
)

router.delete('/gallery/:id', authenticateToken, async (req, res) => {
	try {
		const item = await Gallery.findByPk(req.params.id)
		if (!item) return res.status(404).json({ error: 'Item not found' })
		await item.destroy()
		res.json({ message: 'Deleted' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// Reorder gallery items
router.post('/gallery/reorder', authenticateToken, async (req, res) => {
	try {
		const { order } = req.body // Expect array of { id, order }
		if (!Array.isArray(order)) {
			return res.status(400).json({ error: 'Order must be an array' })
		}

		const promises = order.map(item => {
			return Gallery.update({ order: item.order }, { where: { id: item.id } })
		})

		await Promise.all(promises)
		res.json({ message: 'Order updated' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// --- SETTINGS & CONTACTS ---

router.get('/settings', async (req, res) => {
	try {
		const settings = await Setting.findAll()
		// Convert to object { key: value }
		const settingsObj = {}
		settings.forEach(s => (settingsObj[s.key] = s.value))
		res.json(settingsObj)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

router.post('/settings', authenticateToken, async (req, res) => {
	try {
		const settings = req.body // Expect { key: value, key2: value2 }
		const promises = Object.keys(settings).map(key => {
			return Setting.upsert({ key, value: settings[key] })
		})
		await Promise.all(promises)
		res.json({ message: 'Settings saved' })
	} catch (err) {
		res.status(400).json({ error: err.message })
	}
})

// --- TRANSLATIONS (i18n) ---
router.get('/translations/:lang', (req, res) => {
	const lang = req.params.lang || 'ru'
	const filePath = path.join(__dirname, `../../frontend/i18n/${lang}.json`)
	if (fs.existsSync(filePath)) {
		res.sendFile(filePath)
	} else {
		res.status(404).json({ error: `Translation file for ${lang} not found` })
	}
})

router.post('/translations/:lang', authenticateToken, (req, res) => {
	try {
		const lang = req.params.lang || 'ru'
		const filePath = path.join(__dirname, `../../frontend/i18n/${lang}.json`)

		// Ensure it's valid JSON
		const newData = req.body
		if (!newData || typeof newData !== 'object') {
			return res.status(400).json({ error: 'Invalid data format' })
		}

		fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8')
		res.json({ message: 'Translations saved successfully' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// CONTACTS
router.get('/contacts', async (req, res) => {
	try {
		const contacts = await Contact.findAll()
		res.json(contacts)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

router.post('/contacts', authenticateToken, async (req, res) => {
	// Expect array of contacts or single contact
	try {
		if (Array.isArray(req.body)) {
			// Replace all contacts logic or update?
			// Let's assume simple full replace for now for simplicity or upsert
			await Contact.destroy({ truncate: true }) // Clear all for simplicity
			await Contact.bulkCreate(req.body)
		} else {
			await Contact.create(req.body)
		}
		res.json({ message: 'Contacts saved' })
	} catch (err) {
		res.status(400).json({ error: err.message })
	}
})

// --- FOOTER LINKS ---
router.get('/footer', async (req, res) => {
	try {
		const links = await FooterLink.findAll({ order: [['order', 'ASC']] })
		res.json(links)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

router.post('/footer', authenticateToken, async (req, res) => {
	try {
		await FooterLink.destroy({ truncate: true })
		if (Array.isArray(req.body)) {
			await FooterLink.bulkCreate(req.body)
		}
		res.json({ message: 'Footer updated' })
	} catch (err) {
		res.status(400).json({ error: err.message })
	}
})

// --- SITE STATISTICS ---
router.get('/stats', async (req, res) => {
	try {
		const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

		// Ensure stats for today exist
		const [stat, created] = await SiteStat.findOrCreate({
			where: { date: today },
			defaults: { visits: 0 },
		})

		const totalVisits = await SiteStat.sum('visits')

		res.json({
			today: stat.visits,
			total: totalVisits || 0,
		})
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// --- ADMIN DASHBOARD & STATS ---
router.get('/admin/dashboard', authenticateToken, async (req, res) => {
	try {
		const videoCount = await Video.count()
		const galleryCount = await Gallery.count()
		const newCrmCount = await ContactForm.count({ where: { status: 'new' } })

		const today = new Date().toISOString().split('T')[0]
		const stat = await SiteStat.findOne({ where: { date: today } })
		const todayVisits = stat ? stat.visits : 0
		const totalVisits = await SiteStat.sum('visits')

		res.json({
			videos: videoCount,
			gallery: galleryCount,
			newRequests: newCrmCount,
			visitsToday: todayVisits,
			visitsTotal: totalVisits || 0,
		})
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

router.get('/admin/stats', authenticateToken, async (req, res) => {
	try {
		const stats = await SiteStat.findAll({
			order: [['date', 'DESC']],
			limit: 30,
		})
		res.json(stats)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// --- STATS ROUTES ---
router.post('/stats/visit', async (req, res) => {
	try {
		const today = new Date().toISOString().split('T')[0]
		const [stat, created] = await SiteStat.findOrCreate({
			where: { date: today },
			defaults: { visits: 0 },
		})
		await stat.increment('visits')
		res.json({ message: 'Visit tracked' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

router.delete('/stats', authenticateToken, async (req, res) => {
	try {
		await SiteStat.destroy({ truncate: true })
		res.json({ message: 'Stats have been reset' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// --- BACKUP ROUTES ---
router.get('/backup', authenticateToken, (req, res) => {
	const dbPath = path.join(__dirname, '../database/juggler.sqlite')
	if (fs.existsSync(dbPath)) {
		res.download(dbPath, 'juggler_backup.sqlite')
	} else {
		res.status(404).json({ error: 'Database file not found' })
	}
})

// --- SOCIAL LINKS ROUTES ---
router.get('/social-links', async (req, res) => {
	// Return ALL links so Admin can see inactive ones.
	// Frontend (main.js) will filter by isActive for display.
	try {
		const links = await SocialLink.findAll({
			order: [['order', 'ASC']],
		})
		res.json(links)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

router.post('/social-links', authenticateToken, async (req, res) => {
	try {
		const link = await SocialLink.create(req.body)
		res.status(201).json(link)
	} catch (err) {
		res.status(400).json({ error: err.message })
	}
})

router.put('/social-links/:id', authenticateToken, async (req, res) => {
	try {
		const link = await SocialLink.findByPk(req.params.id)
		if (!link) return res.status(404).json({ error: 'Link not found' })
		await link.update(req.body)
		res.json(link)
	} catch (err) {
		res.status(400).json({ error: err.message })
	}
})

router.delete('/social-links/:id', authenticateToken, async (req, res) => {
	try {
		const link = await SocialLink.findByPk(req.params.id)
		if (!link) return res.status(404).json({ error: 'Link not found' })
		await link.destroy()
		res.json({ message: 'Link deleted' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// Reorder social links
router.post('/social-links/reorder', authenticateToken, async (req, res) => {
	try {
		const { order } = req.body // Expect array of { id, order }
		if (!Array.isArray(order)) {
			return res.status(400).json({ error: 'Order must be an array' })
		}

		const promises = order.map(item => {
			return SocialLink.update(
				{ order: item.order },
				{ where: { id: item.id } },
			)
		})

		await Promise.all(promises)
		res.json({ message: 'Order updated' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// --- TICKET LINK ROUTES ---
router.get('/ticket-link', async (req, res) => {
	try {
		const link = await TicketLink.findOne({ where: { isActive: true } })
		if (!link) return res.json({ url: '', label: 'Купить билеты' })
		res.json(link)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

router.post('/ticket-link', authenticateToken, async (req, res) => {
	try {
		// Деактивировать все предыдущие ссылки
		await TicketLink.update({ isActive: false }, { where: {} })
		const link = await TicketLink.create(req.body)
		res.status(201).json(link)
	} catch (err) {
		res.status(400).json({ error: err.message })
	}
})

router.put('/ticket-link/:id', authenticateToken, async (req, res) => {
	try {
		const link = await TicketLink.findByPk(req.params.id)
		if (!link) return res.status(404).json({ error: 'Link not found' })
		await link.update(req.body)
		res.json(link)
	} catch (err) {
		res.status(400).json({ error: err.message })
	}
})

// --- CONTACT FORM ROUTES ---
router.post('/contact', async (req, res) => {
	try {
		const { firstName, lastName, phone, email, subject } = req.body

		// Валидация
		if (!firstName || !lastName || !phone || !email || !subject) {
			return res.status(400).json({ error: 'Все поля обязательны' })
		}

		// Email валидация
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: 'Некорректный email' })
		}

		// Сохранить в БД
		const contactForm = await ContactForm.create(req.body)

		// Отправить email
		const { sendContactEmail } = require('../utils/email')
		await sendContactEmail({ firstName, lastName, phone, email, subject })

		res
			.status(201)
			.json({ message: 'Сообщение отправлено', id: contactForm.id })
	} catch (err) {
		res.status(500).json({ error: err.message || 'Ошибка отправки сообщения' })
	}
})

router.get('/contact-forms', authenticateToken, async (req, res) => {
	try {
		const forms = await ContactForm.findAll({ order: [['createdAt', 'DESC']] })
		res.json(forms)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

router.put('/contact-forms/:id', authenticateToken, async (req, res) => {
	try {
		const form = await ContactForm.findByPk(req.params.id)
		if (!form) return res.status(404).json({ error: 'Form not found' })
		await form.update(req.body)
		res.json(form)
	} catch (err) {
		res.status(400).json({ error: err.message })
	}
})

router.delete('/contact-forms/:id', authenticateToken, async (req, res) => {
	try {
		const form = await ContactForm.findByPk(req.params.id)
		if (!form) return res.status(404).json({ error: 'Form not found' })
		await form.destroy()
		res.json({ message: 'Form deleted' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

module.exports = router
