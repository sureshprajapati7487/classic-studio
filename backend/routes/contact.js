const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { db, nextId } = require('../db');

// POST /api/contact — Save message and send email notification
router.post('/', async (req, res) => {
    try {
        const { name, email, mobile, message, website } = req.body;

        // ── Honeypot: bots fill this hidden field, humans don't ──
        if (website) {
            // Silently succeed — don't reveal detection to the bot
            return res.json({ success: true, message: 'Message received!' });
        }

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        // Stronger email validation (requires valid TLD)
        const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
        if (!EMAIL_RE.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        // Basic length guards
        if (name.length > 100 || message.length > 2000) {
            return res.status(400).json({ error: 'Input too long' });
        }

        const id = nextId('contact_messages');
        db.get('contact_messages').push({
            id, name, email,
            mobile: mobile || '',
            message,
            is_read: false,
            created_at: new Date().toISOString()
        }).write();

        // Read SMTP from DB settings first (admin panel), fallback to .env
        const siteSettings = db.get('site_settings').value() || {};
        const smtpEmail = siteSettings.smtp_email || process.env.SMTP_EMAIL || '';
        const smtpPass = siteSettings.smtp_password || process.env.SMTP_PASSWORD || '';
        const notifyEmail = siteSettings.notify_email || process.env.NOTIFY_EMAIL || smtpEmail;

        const smtpConfigured = smtpEmail &&
            smtpPass &&
            smtpPass !== 'your_gmail_app_password';

        if (smtpConfigured) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: smtpEmail, pass: smtpPass }
                });
                await transporter.sendMail({
                    from: `"${name}" <${smtpEmail}>`,
                    to: notifyEmail,
                    subject: `📩 New Contact Message from ${name}`,
                    html: `
                        <h2>New Contact Message</h2>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Mobile:</strong> ${mobile || 'Not provided'}</p>
                        <p><strong>Message:</strong></p>
                        <p style="background:#f5f5f5;padding:12px;border-radius:6px;">${message}</p>
                    `
                });
            } catch (emailErr) {
                console.warn('⚠️ Contact email notification failed:', emailErr.message);
            }
        }

        res.json({ success: true, message: 'Message received! We will get back to you shortly.' });
    } catch (err) {
        console.error('Contact error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;

