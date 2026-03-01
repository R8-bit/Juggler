-- Миграция для добавления полей order и crop_data
-- Запустить через: sqlite3 database.sqlite < migrations/add-fields.sql

-- Добавляем поля в Videos
ALTER TABLE Videos ADD COLUMN `order` INTEGER DEFAULT 0;
ALTER TABLE Videos ADD COLUMN crop_data TEXT;

-- Добавляем поле в Galleries
ALTER TABLE Galleries ADD COLUMN `order` INTEGER DEFAULT 0;

-- Проверка
SELECT sql FROM sqlite_master WHERE name='Videos';
SELECT sql FROM sqlite_master WHERE name='Galleries';
