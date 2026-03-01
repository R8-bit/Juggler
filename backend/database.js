const { Sequelize, DataTypes } = require('sequelize')
const path = require('path')
const fs = require('fs')

// Ensure database directory exists
const dbPath = path.join(__dirname, 'database')
if (!fs.existsSync(dbPath)) {
	fs.mkdirSync(dbPath, { recursive: true })
}

// Initialize Sequelize
const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: path.join(dbPath, 'juggler.sqlite'),
	logging: false,
})

// Define Models

// Videos Model
const Video = sequelize.define('Video', {
	title: { type: DataTypes.STRING, allowNull: false },
	description: { type: DataTypes.TEXT },
	duration: { type: DataTypes.STRING }, // e.g., "2:15"
	url: { type: DataTypes.STRING, allowNull: false }, // URL to video file
	preview_url: { type: DataTypes.STRING }, // URL to preview image/video
	crop_data: { type: DataTypes.TEXT }, // JSON string with crop time range (start/end)
	order: { type: DataTypes.INTEGER, defaultValue: 0 }, // Display order
	category: {
		type: DataTypes.STRING,
		defaultValue: 'video_page',
		allowNull: false,
	}, // 'video_page' or 'gallery'
})

// Gallery Model
const Gallery = sequelize.define('Gallery', {
	title: { type: DataTypes.STRING, allowNull: true }, // Made nullable for auto-generation
	description: { type: DataTypes.TEXT },
	image_url: { type: DataTypes.STRING }, // Path to image
	background_gradient: { type: DataTypes.STRING }, // CSS gradient string (legacy support)
	crop_data: { type: DataTypes.TEXT }, // JSON string with crop coordinates
	order: { type: DataTypes.INTEGER, defaultValue: 0 }, // Display order
})

/* Events (Afisha) Model Disabled */

// Settings Model
const Setting = sequelize.define('Setting', {
	key: { type: DataTypes.STRING, unique: true, allowNull: false },
	value: { type: DataTypes.TEXT }, // Store as string, parse JSON if needed
})

// Contacts Model
const Contact = sequelize.define('Contact', {
	type: { type: DataTypes.STRING, allowNull: false }, // email, phone, address, social
	label: { type: DataTypes.STRING },
	value: { type: DataTypes.STRING, allowNull: false },
})

// Footer Links Model
const FooterLink = sequelize.define('FooterLink', {
	text: { type: DataTypes.STRING, allowNull: false },
	url: { type: DataTypes.STRING, allowNull: false },
	order: { type: DataTypes.INTEGER, defaultValue: 0 },
})

// Admin User Model
const Admin = sequelize.define('Admin', {
	username: { type: DataTypes.STRING, unique: true, allowNull: false },
	password: { type: DataTypes.STRING, allowNull: false }, // Hashed password
})

// Site Statistics Model
const SiteStat = sequelize.define('SiteStat', {
	date: { type: DataTypes.DATEONLY, unique: true, allowNull: false },
	visits: { type: DataTypes.INTEGER, defaultValue: 0 },
})

// Contact Form Model (для формы "Связь с нами")
const ContactForm = sequelize.define('ContactForm', {
	firstName: { type: DataTypes.STRING, allowNull: false },
	lastName: { type: DataTypes.STRING, allowNull: false },
	phone: { type: DataTypes.STRING, allowNull: false },
	email: { type: DataTypes.STRING, allowNull: false },
	subject: { type: DataTypes.STRING, allowNull: false },
	message: { type: DataTypes.TEXT },
	status: {
		type: DataTypes.STRING,
		defaultValue: 'new',
		allowNull: false,
	}, // new, read, archived
})

// Social Links Model
const SocialLink = sequelize.define('SocialLink', {
	name: { type: DataTypes.STRING, allowNull: false }, // Instagram, Telegram, X, YouTube
	url: { type: DataTypes.STRING, allowNull: false },
	icon: { type: DataTypes.STRING }, // путь к иконке
	isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
	order: { type: DataTypes.INTEGER, defaultValue: 0 },
})

// Login Log Model (история входов)
const LoginLog = sequelize.define('LoginLog', {
	ip: { type: DataTypes.STRING, allowNull: false },
	userAgent: { type: DataTypes.STRING },
	username: { type: DataTypes.STRING },
	status: { type: DataTypes.STRING, defaultValue: 'success' }, // 'success' or 'fail'
})

// Ticket Link Model (ссылка на покупку билетов)
const TicketLink = sequelize.define('TicketLink', {
	url: { type: DataTypes.STRING, allowNull: false },
	isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
	label: { type: DataTypes.STRING, defaultValue: 'Купить билеты' }, // можно менять текст кнопки
})

// Sync Database (handled in server.js)

module.exports = {
	sequelize,
	Video,
	Gallery,
	Setting,
	Contact,
	FooterLink,
	SiteStat,
	Admin,
	ContactForm,
	SocialLink,
	TicketLink,
	LoginLog,
}
