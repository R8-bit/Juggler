const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Admin, LoginLog } = require('../database')
const { JWT_SECRET, authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Вспомогательная функция — получить реальный IP клиента
function getClientIp(req) {
	return (
		req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
		req.connection?.remoteAddress ||
		req.ip ||
		'unknown'
	)
}

// Login endpoint
router.post('/login', async (req, res) => {
	console.log('[AUTH] Login attempt started for:', req.body.username)
	const ip = getClientIp(req)
	const userAgent = req.headers['user-agent'] || ''
	try {
		const { username, password } = req.body

		if (!username || !password) {
			return res.status(400).json({ error: 'Username and password required' })
		}

		const admin = await Admin.findOne({ where: { username } })

		if (!admin || !admin.password) {
			await LoginLog.create({ ip, userAgent, username, status: 'fail' }).catch(
				() => {},
			)
			return res.status(401).json({ error: 'Invalid credentials' })
		}

		const isValidPassword = await bcrypt.compare(password, admin.password)

		if (!isValidPassword) {
			await LoginLog.create({ ip, userAgent, username, status: 'fail' }).catch(
				() => {},
			)
			return res.status(401).json({ error: 'Invalid credentials' })
		}

		// Логируем успешный вход
		await LoginLog.create({ ip, userAgent, username, status: 'success' }).catch(
			() => {},
		)

		const token = jwt.sign(
			{ id: admin.id, username: admin.username },
			JWT_SECRET,
			{ expiresIn: '15m' },
		)

		res.cookie('auth_token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 15 * 60 * 1000, // 15 минут
			sameSite: 'strict',
		})

		res.json({ success: true, username: admin.username })
	} catch (err) {
		console.error('[CRITICAL] Login error:', err.stack)
		res.status(500).json({ error: 'Server error', detail: err.message, stack: err.stack })
	}
})

// Logout endpoint
router.post('/logout', (req, res) => {
	res.clearCookie('auth_token')
	res.json({ success: true })
})

// Verify token endpoint
router.get('/verify', (req, res) => {
	const token = req.cookies.auth_token
	if (!token) return res.status(401).json({ authenticated: false })
	try {
		const decoded = jwt.verify(token, JWT_SECRET)
		res.json({ authenticated: true, username: decoded.username })
	} catch {
		res.status(401).json({ authenticated: false })
	}
})

// GET /api/auth/login-logs — история входов (последние 100)
router.get('/login-logs', async (req, res) => {
	try {
		const logs = await LoginLog.findAll({
			order: [['createdAt', 'DESC']],
			limit: 100,
		})
		res.json(logs)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// DELETE /api/auth/login-logs — очистить логи
router.delete('/login-logs', async (req, res) => {
	try {
		await LoginLog.destroy({ truncate: true })
		res.json({ message: 'Logs cleared' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// POST /api/auth/change-password — смена пароля
router.post('/change-password', authenticateToken, async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body
		if (!currentPassword || !newPassword) {
			return res.status(400).json({ error: 'Все поля обязательны' })
		}
		if (newPassword.length < 6) {
			return res.status(400).json({ error: 'Пароль минимум 6 символов' })
		}

		const admin = await Admin.findOne()
		if (!admin) return res.status(404).json({ error: 'Admin not found' })

		const valid = await bcrypt.compare(currentPassword, admin.password)
		if (!valid)
			return res.status(401).json({ error: 'Текущий пароль неверный' })

		const hashed = await bcrypt.hash(newPassword, 12)
		await admin.update({ password: hashed })

		res.json({ message: 'Пароль изменён' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

module.exports = router
