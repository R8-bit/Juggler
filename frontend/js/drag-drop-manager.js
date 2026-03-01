// Универсальный менеджер Drag-and-Drop для админ-панели
class DragDropManager {
	constructor(containerSelector, itemSelector, onReorder) {
		this.container = document.querySelector(containerSelector)
		this.itemSelector = itemSelector
		this.onReorder = onReorder
		this.draggedElement = null
		this.init()
	}

	init() {
		if (!this.container) return

		// Делаем элементы перетаскиваемыми
		this.updateDraggableItems()
	}

	updateDraggableItems() {
		const items = this.container.querySelectorAll(this.itemSelector)
		items.forEach((item, index) => {
			item.setAttribute('draggable', 'true')
			item.dataset.order = index

			// Удаляем старые обработчики
			item.removeEventListener('dragstart', this.handleDragStart)
			item.removeEventListener('dragover', this.handleDragOver)
			item.removeEventListener('drop', this.handleDrop)
			item.removeEventListener('dragend', this.handleDragEnd)

			// Добавляем новые
			item.addEventListener('dragstart', this.handleDragStart.bind(this))
			item.addEventListener('dragover', this.handleDragOver.bind(this))
			item.addEventListener('drop', this.handleDrop.bind(this))
			item.addEventListener('dragend', this.handleDragEnd.bind(this))
		})
	}

	handleDragStart(e) {
		this.draggedElement = e.currentTarget
		e.currentTarget.style.opacity = '0.4'
		e.currentTarget.classList.add('dragging')
		e.dataTransfer.effectAllowed = 'move'
	}

	handleDragOver(e) {
		if (e.preventDefault) {
			e.preventDefault()
		}
		e.dataTransfer.dropEffect = 'move'

		const target = e.currentTarget
		if (target !== this.draggedElement) {
			target.classList.add('drag-over')
		}

		return false
	}

	handleDrop(e) {
		if (e.stopPropagation) {
			e.stopPropagation()
		}

		const target = e.currentTarget
		target.classList.remove('drag-over')

		if (this.draggedElement !== target) {
			// Меняем местами элементы
			const allItems = Array.from(
				this.container.querySelectorAll(this.itemSelector),
			)
			const draggedIndex = allItems.indexOf(this.draggedElement)
			const targetIndex = allItems.indexOf(target)

			if (draggedIndex < targetIndex) {
				target.parentNode.insertBefore(this.draggedElement, target.nextSibling)
			} else {
				target.parentNode.insertBefore(this.draggedElement, target)
			}

			// Вызываем callback с новым порядком
			this.saveNewOrder()
		}

		return false
	}

	handleDragEnd(e) {
		e.currentTarget.style.opacity = '1'
		e.currentTarget.classList.remove('dragging')

		// Убираем все индикаторы
		const items = this.container.querySelectorAll(this.itemSelector)
		items.forEach(item => {
			item.classList.remove('drag-over')
		})
	}

	saveNewOrder() {
		const items = this.container.querySelectorAll(this.itemSelector)
		const orderData = Array.from(items).map((item, index) => ({
			id: parseInt(item.dataset.id),
			order: index,
		}))

		if (this.onReorder) {
			this.onReorder(orderData)
		}
	}

	refresh() {
		this.updateDraggableItems()
	}
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
	module.exports = DragDropManager
}
