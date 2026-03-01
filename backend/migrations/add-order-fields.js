const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, '../database.sqlite')
const db = new sqlite3.Database(dbPath)

console.log('🔄 Запуск миграции...')

function runQuery(query) {
	return new Promise((resolve, reject) => {
		db.run(query, function (err) {
			if (err) {
				// Ignore "duplicate column name" error (code 1)
				if (err.message.includes('duplicate column name')) {
					resolve({ skipped: true })
				} else {
					reject(err)
				}
			} else {
				resolve({ skipped: false })
			}
		})
	})
}

async function migrate() {
	try {
		console.log('Добавляем поле `order` в Videos...')
		await runQuery('ALTER TABLE Videos ADD COLUMN `order` INTEGER DEFAULT 0')

		console.log('Добавляем поле `crop_data` в Videos...')
		await runQuery('ALTER TABLE Videos ADD COLUMN crop_data TEXT')

		console.log('Добавляем поле `order` в Galleries...')
		await runQuery('ALTER TABLE Galleries ADD COLUMN `order` INTEGER DEFAULT 0')

		console.log('✅ Миграция успешно завершена.')
	} catch (error) {
		console.error('❌ Ошибка миграции:', error)
	} finally {
		db.close()
	}
}

migrate()
