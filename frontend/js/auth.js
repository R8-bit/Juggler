// Authentication Logic for Admin Panel

const API_URL = '/api'

async function checkAuth() {
	// Прячем тело страницы до завершения проверки
	document.documentElement.style.visibility = 'hidden'

	try {
		const response = await fetch(`${API_URL}/auth/verify`, {
			credentials: 'include',
		})

		if (!response.ok) {
			window.location.replace('/login.html')
			return false
		}

		const data = await response.json()

		if (!data.authenticated) {
			window.location.replace('/login.html')
			return false
		}

		// Авторизован — показываем страницу
		document.documentElement.style.visibility = ''

		// Запускаем периодическую проверку сессии (каждые 60 сек)
		startSessionWatcher()
		return true
	} catch (err) {
		console.error('Auth check error:', err)
		window.location.replace('/login.html')
		return false
	}
}

// Проверяет сессию каждую минуту и выбрасывает при истечении
let sessionWatcherTimer = null

function startSessionWatcher() {
	if (sessionWatcherTimer) return

	sessionWatcherTimer = setInterval(async () => {
		try {
			const r = await fetch(`${API_URL}/auth/verify`, {
				credentials: 'include',
			})
			if (!r.ok) {
				clearInterval(sessionWatcherTimer)
				alert('Сессия истекла. Войдите снова.')
				window.location.replace('/login.html')
				return
			}
			const data = await r.json()
			if (!data.authenticated) {
				clearInterval(sessionWatcherTimer)
				alert('Сессия истекла. Войдите снова.')
				window.location.replace('/login.html')
			}
		} catch {
			// Нет соединения — ничего не делаем
		}
	}, 60_000) // каждые 60 секунд
}

// Handle login form submission
if (window.location.pathname.includes('login.html')) {
	// Check if already authenticated
	fetch(`${API_URL}/auth/verify`, { credentials: 'include' })
		.then(res => res.json())
		.then(data => {
			if (data.authenticated) {
				window.location.replace('/admin.html')
			}
		})
		.catch(() => {})

	document
		.getElementById('loginForm')
		?.addEventListener('submit', async function (e) {
			e.preventDefault()

			const username = document.getElementById('username').value
			const password = document.getElementById('password').value
			const errorMessage = document.getElementById('errorMessage')

			try {
				const response = await fetch(`${API_URL}/auth/login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ username, password }),
				})

				const data = await response.json()

				if (response.ok && data.success) {
					window.location.replace('/admin.html')
				} else {
					errorMessage.textContent = data.error || 'Неверный логин или пароль'
					errorMessage.classList.add('show')
					setTimeout(() => errorMessage.classList.remove('show'), 3000)
					document.getElementById('password').value = ''
				}
			} catch (err) {
				console.error('Login error:', err)
				errorMessage.textContent = 'Ошибка подключения к серверу'
				errorMessage.classList.add('show')
			}
		})
}

// Logout function
async function logout() {
	try {
		await fetch(`${API_URL}/auth/logout`, {
			method: 'POST',
			credentials: 'include',
		})
	} catch {}
	window.location.replace('/login.html')
}

// For browser environment
window.checkAuth = checkAuth
window.logout = logout
