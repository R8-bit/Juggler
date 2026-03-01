const nodemailer = require('nodemailer')

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
})

/**
 * Send contact form email
 * @param {Object} data - Contact form data
 * @param {string} data.firstName
 * @param {string} data.lastName
 * @param {string} data.phone
 * @param {string} data.email
 * @param {string} data.subject
 */
const sendContactEmail = async data => {
	const { firstName, lastName, phone, email, subject } = data

	try {
		// Verification check
		await transporter.verify()

		const info = await transporter.sendMail({
			from: `"${firstName} ${lastName}" <${process.env.EMAIL_FROM}>`, // sender address
			to: process.env.EMAIL_TO, // list of receivers
			subject: `Juggler Contact: ${subject}`, // Subject line
			text: `
                New Contact Message from Juggler Website:
                
                Name: ${firstName} ${lastName}
                Email: ${email}
                Phone: ${phone}
                Subject: ${subject}
                
                ----------------------------------------
                System generated message.
            `, // plain text body
			html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #d32f2f;">New Contact Message from Juggler Website</h2>
                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr>
                    <p style="font-size: 12px; color: #777;">System generated message.</p>
                </div>
            `, // html body
		})

		return info
	} catch (error) {
		throw error
	}
}

module.exports = {
	sendContactEmail,
}
