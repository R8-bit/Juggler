// Скрипт для установки фона блока биографии напрямую в БД
const path = require('path')

// Подключаемся к базе данных через модели проекта
const { Setting } = require('./backend/database')

// URL фото — замените на нужный (или используйте путь к загруженному файлу)
// Фото можно загрузить в папку frontend/assets/img/ и указать путь ниже
const BIO_BG_URL = '/assets/img/bio-bg.jpg'

async function setBioBg() {
  try {
    await Setting.upsert({ key: 'bio_bg_photo', value: BIO_BG_URL })
    console.log('✅ bio_bg_photo установлен:', BIO_BG_URL)
    process.exit(0)
  } catch (err) {
    console.error('❌ Ошибка:', err.message)
    process.exit(1)
  }
}

setBioBg()
