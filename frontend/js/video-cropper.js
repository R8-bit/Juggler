// Компонент для псевдообрезки видео
class VideoCropper {
	constructor() {
		this.videoElement = null
		this.cropData = null
		this.modal = null
		this.init()
	}

	init() {
		// Создаем модальное окно для обрезки видео
		this.createModal()
	}

	createModal() {
		const modal = document.createElement('div')
		modal.id = 'videoCropModal'
		modal.className = 'custom-modal-overlay'
		modal.innerHTML = `
            <div class="custom-modal" style="width: 90%; max-width: 900px;">
                <h3>Обрезка видео</h3>
                <div class="video-crop-container">
                    <video id="videoCropPreview" controls style="width: 100%; max-height: 400px; background: #000;"></video>
                    <div class="crop-controls">
                        <div class="form-group">
                            <label>Начало (сек)</label>
                            <input type="number" id="cropStartTime" min="0" step="0.1" value="0" />
                        </div>
                        <div class="form-group">
                            <label>Конец (сек)</label>
                            <input type="number" id="cropEndTime" min="0" step="0.1" value="0" />
                        </div>
                        <button class="btn btn-secondary" onclick="videoCropper.previewCrop()">Предпросмотр</button>
                    </div>
                </div>
                <div class="custom-modal-actions">
                    <button class="btn btn-secondary" onclick="videoCropper.close()">Отмена</button>
                    <button class="btn btn-primary" onclick="videoCropper.saveCrop()">Сохранить</button>
                </div>
            </div>
        `

		document.body.appendChild(modal)
		this.modal = modal
	}

	open(videoUrl, existingCropData = null) {
		this.videoElement = document.getElementById('videoCropPreview')
		this.videoElement.src = videoUrl

		// Загружаем существующие данные обрезки
		if (existingCropData) {
			try {
				const data = JSON.parse(existingCropData)
				document.getElementById('cropStartTime').value = data.start || 0
				document.getElementById('cropEndTime').value = data.end || 0
			} catch (e) {
				console.error('Error parsing crop data:', e)
			}
		}

		// Устанавливаем максимальное значение для конца после загрузки метаданных
		this.videoElement.onloadedmetadata = () => {
			const duration = this.videoElement.duration
			document.getElementById('cropEndTime').max = duration
			document.getElementById('cropStartTime').max = duration

			if (!existingCropData) {
				document.getElementById('cropEndTime').value = duration
			}
		}

		this.modal.classList.add('active')
	}

	close() {
		this.modal.classList.remove('active')
		if (this.videoElement) {
			this.videoElement.pause()
			this.videoElement.src = ''
		}
	}

	previewCrop() {
		const start = parseFloat(document.getElementById('cropStartTime').value)
		this.videoElement.currentTime = start
		this.videoElement.play()

		// Останавливаем на конечной точке
		const end = parseFloat(document.getElementById('cropEndTime').value)
		const checkTime = () => {
			if (this.videoElement.currentTime >= end) {
				this.videoElement.pause()
			} else {
				requestAnimationFrame(checkTime)
			}
		}
		requestAnimationFrame(checkTime)
	}

	saveCrop() {
		const start = parseFloat(document.getElementById('cropStartTime').value)
		const end = parseFloat(document.getElementById('cropEndTime').value)

		if (start >= end) {
			notificationSystem.error('Начало должно быть меньше конца')
			return
		}

		this.cropData = JSON.stringify({ start, end })

		// Сохраняем в скрытое поле формы
		const cropDataInput = document.getElementById('videoCropData')
		if (cropDataInput) {
			cropDataInput.value = this.cropData
		}

		notificationSystem.success('Обрезка сохранена')
		this.close()
	}

	getCropData() {
		return this.cropData
	}
}

// Создаем глобальный экземпляр
const videoCropper = new VideoCropper()

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
	module.exports = VideoCropper
}
