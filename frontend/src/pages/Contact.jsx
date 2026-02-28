import { useState } from 'react';
import { FiMail, FiPhone, FiSend, FiInstagram, FiAlertCircle, FiYoutube } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import api from '../api';
import toast from 'react-hot-toast';
import './Contact.css';



export default function Contact() {
    const { settings } = useSettings();
    const WHATSAPP_NUMBER = settings.whatsapp || '919876543210';
    const INSTAGRAM_URL = settings.instagram || 'https://instagram.com/yourprofile';
    const EDITOR_EMAIL = settings.email || 'youremail@gmail.com';
    const YOUTUBE_URL = settings.youtube || '';

    const CONTACT_CARDS = [
        {
            icon: <FaWhatsapp size={28} />,
            title: 'WhatsApp',
            value: `+${WHATSAPP_NUMBER}`,
            desc: 'Fastest response — usually within 1 hour',
            href: `https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I would like to discuss a project.`,
            color: '#25d366',
            label: 'Message on WhatsApp',
            external: true,
        },
        {
            icon: <FiInstagram size={28} />,
            title: 'Instagram',
            value: '@yourprofile',
            desc: 'Check out our latest work and DM us',
            href: INSTAGRAM_URL,
            color: '#e1306c',
            label: 'Visit Instagram',
            external: true,
        },
        ...(YOUTUBE_URL ? [{
            icon: <FiYoutube size={28} />,
            title: 'YouTube',
            value: 'Watch our work',
            desc: 'Subscribe to our channel for editing tutorials & reels',
            href: YOUTUBE_URL,
            color: '#ff0000',
            label: 'Visit YouTube Channel',
            external: true,
        }] : []),
        {
            icon: <FiMail size={28} />,
            title: 'Email',
            value: EDITOR_EMAIL,
            desc: 'For detailed project briefs and invoices',
            href: `mailto:${EDITOR_EMAIL}`,
            color: '#d4af37',
            label: 'Send Email',
            external: false,
        },
    ];

    const [form, setForm] = useState({ name: '', email: '', mobile: '', message: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.includes('@')) e.email = 'Enter a valid email';
        if (!form.message.trim()) e.message = 'Message cannot be empty';
        return e;
    };

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setLoading(true);
        try {
            await api.post('/api/contact', form);
            setSent(true);
            toast.success('Message sent! We will get back to you soon. 💬');
        } catch {
            toast.error('Failed to send message. Try WhatsApp instead!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page page-enter">

            {/* Header */}
            <div className="contact-header">
                <div className="contact-header__glow" />
                <div className="container contact-header__content">
                    <span className="section-label">Get In Touch</span>
                    <h1 className="section-title">Let's <span className="gold-text">Connect</span></h1>
                    <div className="gold-divider" />
                    <p className="section-desc">
                        Have a project in mind? We'd love to hear about it. Reach out anytime!
                    </p>
                </div>
            </div>

            <section className="section contact-section">
                <div className="container">

                    {/* Contact Cards */}
                    <div className="contact-cards">
                        {CONTACT_CARDS.map(({ icon, title, value, desc, href, color, label, external }) => (
                            <a
                                key={title}
                                href={href}
                                target={external ? '_blank' : undefined}
                                rel={external ? 'noopener noreferrer' : undefined}
                                className="contact-card card"
                                style={{ '--contact-color': color }}
                            >
                                <div className="contact-card__icon" style={{ color }}>
                                    {icon}
                                </div>
                                <h3 className="contact-card__title">{title}</h3>
                                <p className="contact-card__value" style={{ color }}>{value}</p>
                                <p className="contact-card__desc">{desc}</p>
                                <span className="contact-card__cta">
                                    {label} →
                                </span>
                            </a>
                        ))}
                    </div>

                    {/* Form + Map layout */}
                    <div className="contact-layout">

                        {/* Form */}
                        <div className="contact-form-wrap">
                            <h2 className="contact-form__heading">
                                Send us a <span className="gold-text">Message</span>
                            </h2>
                            <div className="gold-divider" style={{ marginBottom: 32 }} />

                            {sent ? (
                                <div className="contact-sent card-glass" style={{ padding: 36, borderRadius: 12, border: '1px solid var(--border-glow)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                                    <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: 12 }}>Message Received!</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        Thank you, <strong style={{ color: 'var(--gold)' }}>{form.name}</strong>!
                                        We've received your message and will get back to you soon.
                                    </p>
                                    <a
                                        href={`https://wa.me/${WHATSAPP_NUMBER}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="btn btn-primary"
                                        style={{ marginTop: 24, display: 'inline-flex', gap: 8, alignItems: 'center' }}
                                    >
                                        <FaWhatsapp size={18} /> Also WhatsApp Us
                                    </a>
                                </div>
                            ) : (
                                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                                    <div className="contact-form__grid">
                                        <div className="form-group">
                                            <label className="form-label">Your Name *</label>
                                            <input
                                                type="text"
                                                className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                                                placeholder="Enter your name"
                                                value={form.name}
                                                onChange={handleChange('name')}
                                            />
                                            {errors.name && <span className="form-error"><FiAlertCircle size={12} /> {errors.name}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Mobile (Optional)</label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                placeholder="10-digit number"
                                                value={form.mobile}
                                                onChange={handleChange('mobile')}
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email Address *</label>
                                        <input
                                            type="email"
                                            className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                                            placeholder="yourname@email.com"
                                            value={form.email}
                                            onChange={handleChange('email')}
                                        />
                                        {errors.email && <span className="form-error"><FiAlertCircle size={12} /> {errors.email}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Your Message *</label>
                                        <textarea
                                            className={`form-textarea ${errors.message ? 'form-input--error' : ''}`}
                                            placeholder="Tell us about your project, requirements, timeline, or any questions you have..."
                                            rows={5}
                                            value={form.message}
                                            onChange={handleChange('message')}
                                        />
                                        {errors.message && <span className="form-error"><FiAlertCircle size={12} /> {errors.message}</span>}
                                    </div>

                                    <button type="submit" className="btn btn-primary contact-submit" disabled={loading}>
                                        {loading ? (
                                            <><span className="spinner" /> Sending...</>
                                        ) : (
                                            <><FiSend size={16} /> Send Message</>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Info Panel */}
                        <div className="contact-info">
                            <div className="contact-info__card card">
                                <h3 className="contact-info__title">Working Hours</h3>
                                <div className="contact-info__row">
                                    <span>Monday – Saturday</span>
                                    <strong>9 AM – 9 PM</strong>
                                </div>
                                <div className="contact-info__row">
                                    <span>Sunday</span>
                                    <strong>By appointment</strong>
                                </div>
                                <div className="contact-info__row">
                                    <span>Response Time</span>
                                    <strong style={{ color: '#25d366' }}>Within 1 hour</strong>
                                </div>
                            </div>

                            <div className="contact-info__card card">
                                <h3 className="contact-info__title">Quick Links</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                                    <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
                                        className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: 10, fontSize: '0.88rem' }}>
                                        <FaWhatsapp size={18} style={{ color: '#25d366' }} /> Chat on WhatsApp
                                    </a>
                                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
                                        className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: 10, fontSize: '0.88rem' }}>
                                        <FiInstagram size={18} style={{ color: '#e1306c' }} /> View Instagram
                                    </a>
                                    {YOUTUBE_URL && (
                                        <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer"
                                            className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: 10, fontSize: '0.88rem' }}>
                                            <FiYoutube size={18} style={{ color: '#ff0000' }} /> Watch on YouTube
                                        </a>
                                    )}
                                    <a href={`mailto:${EDITOR_EMAIL}`}
                                        className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: 10, fontSize: '0.88rem' }}>
                                        <FiMail size={18} style={{ color: '#d4af37' }} /> Send Email
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
