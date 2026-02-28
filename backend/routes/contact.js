const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { db, nextId } = require('../db');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

// POST /api/contact — Save message and send email
router.post('/', async (req, res) => {
    try {
        const { name, email, mobile, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        const id = nextId('contact_messages');
        db.get('contact_messages').push({
            id, name, email,
            mobile: mobile || '',
            message,
            is_read: false,
            created_at: new Date().toISOString()
        }).write();

        // Send email notification if SMTP is configured
        if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD !== 'your_gmail_app_password') {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
                });
                await transporter.sendMail({
                    from: `"${name}" <${process.env.SMTP_EMAIL}>`,
                    to: process.env.NOTIFY_EMAIL,
                    subject: `📩 New Contact Message from ${name}`,
                    html: `<h2>New Contact Message</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mobile:</strong> ${mobile || 'Not provided'}</p>
            <p><strong>Message:</strong></p><p>${message}</p>`
                });
            } catch (emailErr) {
                console.warn('Email notification failed:', emailErr.message);
            }
        }

        res.json({ success: true, message: 'Message received! We will get back to you shortly.' });
    } catch (err) {
        console.error('Contact error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;
