// Кастомная система уведомлений для админ-панели
class NotificationSystem {
	constructor() {
		this.container = null
		this.notifications = []
		this.init()
	}

	init() {
		// Создаем контейнер если его нет
		if (!document.getElementById('notification-container')) {
			this.container = document.createElement('div')
			this.container.id = 'notification-container'
			this.container.className = 'notification-container'
			document.body.appendChild(this.container)
		} else {
			this.container = document.getElementById('notification-container')
		}
	}

	show(message, type = 'success', duration = 3000) {
		const notif = document.createElement('div')
		notif.className = `admin-notification ${type}`

		const icon = type === 'success' ? '✔' : type === 'error' ? '✖' : '⚠'

		notif.innerHTML = `
            <div class="icon">${icon}</div>
            <div class="message">${message}</div>
        `

		this.container.appendChild(notif)
		this.notifications.push(notif)

		// Анимация появления
		setTimeout(() => notif.classList.add('show'), 10)

		// Автоудаление
		setTimeout(() => {
			notif.classList.remove('show')
			setTimeout(() => {
				notif.remove()
				this.notifications = this.notifications.filter(n => n !== notif)
			}, 300)
		}, duration)

		return notif
	}

	showUndo(message, onUndo, duration = 5000) {
		const notif = document.createElement('div')
		notif.className = 'admin-notification warning undo-notification'

		notif.innerHTML = `
            <div class="message">${message}</div>
            <button class="undo-btn">Отменить</button>
            <div class="undo-timer">
                <div class="undo-timer-bar"></div>
            </div>
        `

		this.container.innerHTML = '' // Очищаем предыдущие
		this.container.appendChild(notif)

		const timerBar = notif.querySelector('.undo-timer-bar')
		const undoBtn = notif.querySelector('.undo-btn')

		// Анимация таймера
		setTimeout(() => {
			notif.classList.add('show')
			timerBar.style.transition = `width ${duration}ms linear`
			timerBar.style.width = '0%'
		}, 10)

		let cancelled = false

		// Обработчик отмены
		undoBtn.onclick = () => {
			cancelled = true
			onUndo()
			notif.classList.remove('show')
			setTimeout(() => notif.remove(), 300)
		}

		// Автоудаление
		setTimeout(() => {
			if (!cancelled) {
				notif.classList.remove('show')
				setTimeout(() => notif.remove(), 300)
			}
		}, duration)

		return notif
	}

	success(message) {
		return this.show(message, 'success')
	}

	error(message) {
		return this.show(message, 'error')
	}

	warning(message) {
		return this.show(message, 'warning')
	}

	clear() {
		this.notifications.forEach(notif => notif.remove())
		this.notifications = []
	}
}

// Создаем глобальный экземпляр
const notificationSystem = new NotificationSystem()

// Экспорт для использования
if (typeof module !== 'undefined' && module.exports) {
	module.exports = NotificationSystem
}
