# 🎪 JUGGLER - Сайт театра артистов-жонглеров

Современный fullstack web-сайт для театра циркового искусства с админ-панелью, галереей, видео и системой бронирования билетов.

## 🚀 Технологии

### Backend

- **Node.js** + **Express.js** - серверная часть
- **SQLite** + **Sequelize ORM** - база данных
- **JWT** - аутентификация
- **Bcryptjs** - хеширование паролей
- **Nodemailer** - отправка email
- **Helmet** + **Compression** - security и performance
- **Express-rate-limit** - защита от DDoS

### Frontend

- **HTML5** + **современный CSS3**(Flexbox, Grid, Animations)
- **Vanilla JavaScript** (ES6+)
- **SASS/SCSS** - препроцессор стилей
- **Международная локализация** (RU/EN)

## 📂 Структура проекта

```
juggler/
├── backend/
│   ├── server.js           # Главный сервер
│   ├── database.js         # Модели и подключение к БД
│   ├── routes/
│   │   ├── api.js          # API endpoints
│   │   └── auth.js         # Аутентификация
│   ├── middleware/
│   │   └── auth.js         # JWT middleware
│   ├── utils/
│   │   └── email.js        # Email утилиты
│   └── database/
│       └── juggler.sqlite  # База данных
├── frontend/
│   ├── index.html          # Главная страница
│   ├── video.html          # Страница видео
│   ├── gallery.html        # Галерея
│   ├── contact.html        # Контакты
│   ├── admin.html          # Админ-панель
│   ├── login.html          # Логин
│   ├── css/                # Стили
│   ├── js/                 # JavaScript
│   ├── scss/               # SASS исходники
│   ├── i18n/               # Файлы локализации
│   └── assets/             # Статические файлы
├── uploads/                # Загруженные файлы
│   ├── videos/
│   ├── gallery/
│   └── events/
├── .env                    # Переменные окружения (не в git)
├── .env.example            # Пример .env
└── .gitignore

```

## 🛠️ Установка и запуск

### Требования

- Node.js >= 16.x
- npm >= 8.x

### Шаги установки

1. **Клонируйте репозиторий**

   ```bash
   git clone https://github.com/yourusername/juggler.git
   cd juggler
   ```

2. **Ус тановите зависимости**

   ```bash
   cd backend
   npm install
   ```

3. **Настройте переменные окружения**

   ```bash
   cp ../.env.example ../.env
   # Отредактируйте .env файл своими данными
   ```

4. **Запустите сервер**
   - **Development режим:**
     ```bash
     npm run dev
     ```
   - **Production режим:**
     ```bash
     NODE_ENV=production npm start
     ```

5. **Откройте браузер**
   ```
   http://localhost:3000
   ```

## 🔐 Конфигурация

Отредактируйте `.env` файл:

```env
# Server
PORT=3000
NODE_ENV=production

# Database (для production рекомендуется PostgreSQL)
DB_PATH=./backend/database/juggler.sqlite

# JWT (создайте сложный ключ командой ниже)
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-strong-secret-key

# Email (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-digit-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=recipient@gmail.com

# Frontend URL (для CORS)
FRONTEND_URL=https://yourdomain.com
```

### Получение Gmail App Password

1. Зайдите в настройки Google Account
2. Security → 2-Step Verification → App passwords
3. Создайте пароль для "Mail"
4. Скопируйте 16-значный пароль в `SMTP_PASS`

## 📡 API Endpoints

### Публичные

- `GET /api/videos` - Получить список видео
- `GET /api/gallery` - Получить галерею
- `GET /api/events` - Получить события
- `GET /api/social-links` - Социальные сети
- `GET /api/ticket-link` - Ссылка на билеты
- `POST /api/contact` - Отправить сообщение
- `POST /api/stats/visit` - Записать посещение

### Аутентификация

- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход
- `GET /api/auth/verify` - Проверка токена

### Админ (требуется JWT)

- `POST/PUT/DELETE /api/videos/:id` - Управление видео
- `POST/PUT/DELETE /api/gallery/:id` - Управление галереей
- `POST/PUT/DELETE /api/events/:id` - Управление событиями
- `GET /api/contact-forms` - Просмотр обращений
- `GET /api/stats` - Статистика
- `GET /api/backup` - Скачать backup БД

## 🎨 Особенности

- ✨ **Современный дизайн** - адаптивный, анимированный интерфейс
- 🔒 **Безопасность** - Helmet, CORS, Rate Limiting, JWT
- 📊 **Админ-панель** - полное управление контентом
- 🌍 **Мультиязычность** - RU/EN локализация
- 📧 **Email отправка** - уведомления через Nodemailer
- 📈 **Статистика** - трекинг посещений
- 🎬 **Видео/галерея** - загрузка и управление медиа
- ⚡ **Производительность** - Compression, оптимизация

## 🚀 Развертывание

### На VPS/Dedicated сервере

1. **Установите Node.js и PM2**

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

2. **Клонируйте и установите**

   ```bash
   git clone your-repo
   cd juggler/backend
   npm install --production
   ```

3. **Настройте .env для production**

4. **Запустите с PM2**

   ```bash
   pm2 start server.js --name juggler
   pm2 save
   pm2 startup
   ```

5. **Настройте Nginx или Apache** как reverse proxy

### Пример Nginx конфигурации

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🧪 Тестирование

Проверьте все функции:

```bash
# Проверка API
curl http://localhost:3000/health
curl http://localhost:3000/api/videos
curl http://localhost:3000/api/events

# Проверка админки (требуется токен)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'
```

## 🛡️ Безопасность

Проект использует:

- **Helmet.js** - Security headers
- **Rate Limiting** - Защита от DDoS
- **JWT** - Безопасная аутентификация
- **Bcrypt** - Хеш паролей
- **CORS** - Контроль доступа
- **Input Validation** - Валидация данных

## 📝 Лицензия

MIT License - используйте свободно!

## 👤 Автор

**El (Elbrus)**  
Senior Full-Stack Developer

## 🤝 Поддержка

Если возникли вопросы:

- Откройте Issue в GitHub
- Email: your-email@domain.com

---

**Made with ❤️ by El**
