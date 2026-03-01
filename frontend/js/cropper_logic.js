// --- CROPPER LOGIC ---
let cropper
let currentCroppedBlob = null

function setupCropper() {
	const photoInput = document.getElementById('photoFile')
	const image = document.getElementById('imageToCrop')

	if (!photoInput) return

	photoInput.addEventListener('change', function (e) {
		const files = e.target.files
		if (files && files.length > 0) {
			const file = files[0]
			const reader = new FileReader()
			reader.onload = function (e) {
				image.src = e.target.result
				document.getElementById('cropModal').style.display = 'flex'

				if (cropper) {
					cropper.destroy()
				}

				cropper = new Cropper(image, {
					aspectRatio: NaN, // Free crop
					viewMode: 2,
				})
			}
			reader.readAsDataURL(file)
		}
	})
}

function closeCropModal() {
	document.getElementById('cropModal').style.display = 'none'
	if (cropper) {
		cropper.destroy()
		cropper = null
	}
	document.getElementById('photoFile').value = '' // Reset input if cancelled
}

function saveCrop() {
	if (!cropper) return

	cropper.getCroppedCanvas().toBlob(blob => {
		currentCroppedBlob = blob

		// Create preview manually
		const parent = document.getElementById('photoFile').parentElement
		const oldPreview = parent.querySelector('.file-preview-container')
		if (oldPreview) oldPreview.remove()

		const url = URL.createObjectURL(blob)
		const div = document.createElement('div')
		div.className = 'file-preview-container'
		div.innerHTML = `
			<div class="preview-media">
				<img src="${url}" style="max-height:100px; max-width:100px; object-fit:cover;">
			</div>
			<button type="button" class="btn-icon delete-preview" style="color:red;">${ICONS.close}</button>
		`
		parent.appendChild(div)

		div.querySelector('.delete-preview').onclick = () => {
			document.getElementById('photoFile').value = ''
			currentCroppedBlob = null
			div.remove()
		}

		document.getElementById('cropModal').style.display = 'none'
		if (cropper) {
			cropper.destroy()
			cropper = null
		}
	}, 'image/jpeg')
}
