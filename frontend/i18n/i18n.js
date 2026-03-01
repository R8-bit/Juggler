// i18n - Система мультиязычности для JUGGLER
// Поддерживает русский (по умолчанию) и английский языки

class I18n {
	constructor() {
		this.currentLang = localStorage.getItem('juggler_lang') || 'ru'
		this.translations = {}
		this.loadTranslations()
	}

	async loadTranslations() {
		try {
			const [ru, en] = await Promise.all([
				fetch('/i18n/ru.json').then(r => r.json()),
				fetch('/i18n/en.json').then(r => r.json()),
			])
			this.translations = { ru, en }
			this.updatePage()
		} catch (error) {
			console.error('Ошибка загрузки переводов:', error)
		}
	}

	// Получить перевод по ключу (например, "nav.home")
	t(key) {
		const keys = key.split('.')
		let value = this.translations[this.currentLang]

		for (const k of keys) {
			if (value && value[k]) {
				value = value[k]
			} else {
				console.warn(`Перевод не найден: ${key}`)
				return key
			}
		}

		return value
	}

	// Переключить язык
	switchLanguage(lang) {
		if (this.translations[lang]) {
			this.currentLang = lang
			localStorage.setItem('juggler_lang', lang)
			this.updatePage()
			// Обновить кнопку переключателя
			this.updateLanguageButton()
		}
	}

	// Обновить все элементы с data-i18n атрибутом
	updatePage() {
		document.querySelectorAll('[data-i18n]').forEach(el => {
			const key = el.getAttribute('data-i18n')
			const translation = this.t(key)

			// Проверяем, куда вставлять текст
			const attr = el.getAttribute('data-i18n-attr')
			if (attr) {
				el.setAttribute(attr, translation)
			} else {
				el.textContent = translation
			}
		})

		// Обновить язык документа
		document.documentElement.lang = this.currentLang

		// Обновить title
		document.title = this.t('site.title')

		// Dispatch event for other scripts
		window.dispatchEvent(new CustomEvent('i18nUpdated'))

		// Обновить кнопку переключателя (чтобы она соответствовала текущему языку при загрузке)
		this.updateLanguageButton()
	}

	// Обновить кнопку переключателя языка
	updateLanguageButton() {
		const langBtn = document.querySelector('.language-switcher')
		if (langBtn) {
			langBtn.textContent = this.currentLang.toUpperCase()
		}
	}

	// Получить текущий язык
	getCurrentLanguage() {
		return this.currentLang
	}
}

// Создать глобальный экземпляр
const i18n = new I18n()

// Экспортировать для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
	module.exports = i18n
}
