const jwt = require('jsonwebtoken')

const JWT_SECRET =
	process.env.JWT_SECRET || 'juggler-secret-key-change-in-production'

// Middleware для проверки JWT токена через httpOnly cookie
function authenticateToken(req, res, next) {
	const token = req.cookies.auth_token

	if (!token) {
		return res.status(401).json({ error: 'Unauthorized: No token provided' })
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET)
		req.user = decoded
		next()
	} catch (err) {
		return res.status(401).json({ error: 'Unauthorized: Invalid token' })
	}
}

module.exports = { authenticateToken, JWT_SECRET }
