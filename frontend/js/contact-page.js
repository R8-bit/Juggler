// JavaScript для страницы контактов
// API_URL определен в main.js

document.addEventListener('DOMContentLoaded', () => {
	initContactForm()
	loadBackgroundVideo()

	// Force static visibility
	document.querySelectorAll('.animate-text').forEach(el => {
		el.style.opacity = '1'
		el.style.transform = 'none'
		el.classList.remove('animate-text')
	})
})

// Инициализация формы контактов
function initContactForm() {
	const form = document.getElementById('contactForm')
	if (!form) return

	form.addEventListener('submit', async e => {
		e.preventDefault()

		const submitBtn = document.getElementById('submitBtn')
		const formMessage = document.getElementById('formMessage')

		// Валидация
		if (!validateForm()) {
			showMessage(
				'error',
				i18n?.t('contact.form.validationError') ||
					'Пожалуйста, заполните все поля корректно',
			)
			return
		}

		// Подготовка данных
		const formData = {
			firstName: form.firstName.value.trim(),
			lastName: form.lastName.value.trim(),
			phone: form.countryCode.value + form.phone.value.trim(),
			email: form.email.value.trim(),
			subject: form.subject.value.trim(),
		}

		// Отправка
		try {
			submitBtn.disabled = true
			submitBtn.innerHTML = `<span data-i18n="contact.form.sending">Отправка...</span>`

			const response = await fetch(`${API_URL}/contact`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			})

			const responseData = await response.json()

			if (response.ok) {
				showMessage(
					'success',
					i18n?.t('contact.form.success') || 'Сообщение отправлено!',
				)
				form.reset()
			} else {
				showMessage(
					'error',
					responseData.error ||
						i18n?.t('contact.form.error') ||
						'Ошибка от правки',
				)
			}
		} catch (error) {
			showMessage(
				'error',
				i18n?.t('contact.form.error') || 'Ошибка отправки. Попробуйте позже.',
			)
		} finally {
			submitBtn.disabled = false
			submitBtn.innerHTML = `<span data-i18n="contact.form.submit">Отправить</span>`
			if (typeof i18n !== 'undefined') {
				i18n.updatePage()
			}
		}
	})
}

// Валидация формы
function validateForm() {
	const form = document.getElementById('contactForm')
	if (!form) return false

	// Проверка обязательных полей
	const firstName = form.firstName.value.trim()
	const lastName = form.lastName.value.trim()
	const phone = form.phone.value.trim()
	const email = form.email.value.trim()
	const subject = form.subject.value.trim()

	if (!firstName || !lastName || !phone || !email || !subject) {
		return false
	}

	// Строгая проверка email
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
	if (!emailRegex.test(email)) {
		showMessage('error', 'Пожалуйста, введите корректный email адрес')
		return false
	}

	// Проверка телефона (минимум 10 цифр)
	const phoneDigits = phone.replace(/\D/g, '')
	if (phoneDigits.length < 10) {
		showMessage('error', 'Пожалуйста, введите корректный номер телефона')
		return false
	}

	return true
}

// Показать сообщение
function showMessage(type, message) {
	const formMessage = document.getElementById('formMessage')
	if (!formMessage) return

	formMessage.className = `form-message ${type}`
	formMessage.textContent = message
	formMessage.style.display = 'block'

	// Скрыть через 5 секунд
	setTimeout(() => {
		formMessage.style.display = 'none'
	}, 5000)
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
		// Silent fail for background video
	}
}

// Форматирование ввода телефона и кастомный селект
document.addEventListener('DOMContentLoaded', () => {
	const phoneInput = document.getElementById('phone')
	if (phoneInput) {
		phoneInput.addEventListener('input', e => {
			// Разрешаем только цифры, пробелы и дефисы
			e.target.value = e.target.value.replace(/[^\d\s-]/g, '')
		})
	}

	initCustomSelect()
})

// Кастомный селект для выбора страны
function initCustomSelect() {
	const select = document.getElementById('countryCode')
	if (!select) return

	// Создаем обертку
	const wrapper = document.createElement('div')
	wrapper.className = 'custom-select-wrapper'
	select.parentNode.insertBefore(wrapper, select)
	wrapper.appendChild(select)

	// Скрываем оригинал
	select.classList.add('hidden-select')

	// Создаем UI
	const customSelect = document.createElement('div')
	customSelect.className = 'custom-select'
	wrapper.appendChild(customSelect)

	const trigger = document.createElement('div')
	trigger.className = 'custom-select-trigger'

	// Функция для получения HTML флага
	const getFlagHtml = iso => {
		if (!iso) return ''
		return `<img src="https://flagcdn.com/24x18/${iso}.png" alt="${iso}" class="flag-icon" />`
	}

	// Функция для получения названия страны
	const getCountryName = (iso, defaultText) => {
		// Проверяем, загружены ли переводы (i18n.translations не пустой)
		if (
			typeof i18n !== 'undefined' &&
			iso &&
			i18n.translations &&
			Object.keys(i18n.translations).length > 0
		) {
			const translated = i18n.t(`contact.countries.${iso}`)
			if (translated !== `contact.countries.${iso}`) {
				return translated
			}
		}
		// Fallback: пробуем достать имя из скобок "Код (Имя)"
		const match = defaultText.match(/\(([^)]+)\)/)
		return match ? match[1] : defaultText
	}

	// Функция обновления текста триггера и опций
	const updateTexts = () => {
		const selectedIndex = select.selectedIndex
		const selectedOption = select.options[selectedIndex]
		const selectedIso = selectedOption.dataset.iso || 'ru'
		const selectedName = getCountryName(selectedIso, selectedOption.text)

		// Обновляем триггер: Флаг + Код
		trigger.innerHTML = `${getFlagHtml(selectedIso)} <span>${selectedOption.value}</span>`

		// Обновляем опции
		const customOptions = optionsContainer.querySelectorAll('.custom-option')
		customOptions.forEach((co, index) => {
			const originalOption = select.options[index]
			const iso = originalOption.dataset.iso || ''
			const name = getCountryName(iso, originalOption.text)
			const code = originalOption.value

			const textSpan = co.querySelector('.option-text')
			if (textSpan) {
				textSpan.textContent = `${code} (${name})`
			}
		})
	}

	const optionsContainer = document.createElement('div')
	optionsContainer.className = 'custom-options'
	customSelect.appendChild(optionsContainer)

	// Инициализация триггера (первичная)
	// Текст будет обновлен через updateTexts, но структуру создадим сразу
	customSelect.insertBefore(trigger, optionsContainer)

	// Генерируем опции
	Array.from(select.options).forEach(option => {
		const customOption = document.createElement('div')
		customOption.className = 'custom-option'
		const iso = option.dataset.iso || ''

		// Структура опции
		customOption.innerHTML = `
            <div class="option-content">
                ${getFlagHtml(iso)}
                <span class="option-text"></span>
            </div>
        `
		customOption.dataset.value = option.value
		customOption.dataset.iso = iso

		if (option.selected) {
			customOption.classList.add('selected')
		}

		customOption.addEventListener('click', () => {
			select.value = option.value
			select.dispatchEvent(new Event('change'))

			// Обновляем классы
			document
				.querySelectorAll('.custom-option')
				.forEach(opt => opt.classList.remove('selected'))
			customOption.classList.add('selected')

			// Закрываем и обновляем триггер
			customSelect.classList.remove('open')
			updateTexts() // Обновит текст триггера
		})

		optionsContainer.appendChild(customOption)
	})

	// Первичное обновление текстов
	updateTexts()

	// Открытие/закрытие
	trigger.addEventListener('click', e => {
		e.stopPropagation()
		document
			.querySelectorAll('.custom-select')
			.forEach(s => s !== customSelect && s.classList.remove('open'))
		customSelect.classList.toggle('open')
	})

	// Закрытие при клике снаружи
	document.addEventListener('click', e => {
		if (!customSelect.contains(e.target)) {
			customSelect.classList.remove('open')
		}
	})

	// Блокировка скролла страницы при скролле списка
	optionsContainer.addEventListener(
		'wheel',
		e => {
			const scrollTop = optionsContainer.scrollTop
			const scrollHeight = optionsContainer.scrollHeight
			const height = optionsContainer.clientHeight
			const delta = e.deltaY
			const up = delta < 0
			const down = delta > 0

			if (!up && !down) return

			if (
				(up && scrollTop - delta <= 0) ||
				(down && scrollTop + delta >= scrollHeight - height)
			) {
				e.stopPropagation()
			}
		},
		{ passive: false },
	)

	// Слушаем изменение языка
	window.addEventListener('i18nUpdated', () => {
		updateTexts()
	})
}
