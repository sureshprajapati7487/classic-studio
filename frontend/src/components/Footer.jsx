import { Link } from 'react-router-dom';
import { FiInstagram, FiMail, FiHeart, FiYoutube } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import './Footer.css';

const QUICK_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/order', label: 'Order Now' },
    { to: '/contact', label: 'Contact' },
];

const SERVICES = [
    'Wedding Video Edit',
    'Reels & Shorts',
    'YouTube Video Edit',
    'Photo Retouching',
    'Color Grading',
    'Cinematic Edit',
];

export default function Footer() {
    const { settings } = useSettings();
    const WHATSAPP_NUMBER = settings.whatsapp || '919876543210';
    const INSTAGRAM_URL = settings.instagram || 'https://instagram.com';
    const YOUTUBE_URL = settings.youtube || '';
    const EDITOR_EMAIL = settings.email || 'youremail@gmail.com';
    const EDITOR_NAME = settings.editor_name || 'Classic Studio';
    const year = new Date().getFullYear();


    return (
        <footer className="footer">
            {/* Gold divider top */}
            <div className="footer__glow-line" />

            <div className="container footer__grid">

                {/* Brand column */}
                <div className="footer__brand">
                    <Link to="/" className="footer__logo">
                        <img src="/logo.png" alt="Classic Studio" className="footer__logo-img" />
                    </Link>
                    <p className="footer__tagline">
                        Professional Video & Photo Editing that transforms your moments into cinematic masterpieces.
                    </p>
                    <div className="footer__socials">
                        <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}`}
                            target="_blank" rel="noopener noreferrer"
                            className="footer__social footer__social--wa"
                            aria-label="WhatsApp"
                        >
                            <FaWhatsapp size={18} />
                        </a>
                        <a
                            href={INSTAGRAM_URL}
                            target="_blank" rel="noopener noreferrer"
                            className="footer__social footer__social--ig"
                            aria-label="Instagram"
                        >
                            <FiInstagram size={18} />
                        </a>
                        {YOUTUBE_URL && (
                            <a
                                href={YOUTUBE_URL}
                                target="_blank" rel="noopener noreferrer"
                                className="footer__social footer__social--yt"
                                aria-label="YouTube"
                            >
                                <FiYoutube size={18} />
                            </a>
                        )}
                        <a
                            href={`mailto:${EDITOR_EMAIL}`}
                            className="footer__social footer__social--mail"
                            aria-label="Email"
                        >
                            <FiMail size={18} />
                        </a>
                    </div>
                </div>

                {/* Quick links */}
                <div className="footer__col">
                    <h4 className="footer__col-title">Quick Links</h4>
                    <ul className="footer__list">
                        {QUICK_LINKS.map(({ to, label }) => (
                            <li key={to}>
                                <Link to={to} className="footer__link">{label}</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Services */}
                <div className="footer__col">
                    <h4 className="footer__col-title">Services</h4>
                    <ul className="footer__list">
                        {SERVICES.map((s) => (
                            <li key={s}>
                                <span className="footer__service">{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact */}
                <div className="footer__col">
                    <h4 className="footer__col-title">Get In Touch</h4>
                    <div className="footer__contact-list">
                        <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}`}
                            target="_blank" rel="noopener noreferrer"
                            className="footer__contact-item"
                        >
                            <FaWhatsapp size={16} className="footer__contact-icon footer__contact-icon--wa" />
                            <span>+{WHATSAPP_NUMBER}</span>
                        </a>
                        <a href={`mailto:${EDITOR_EMAIL}`} className="footer__contact-item">
                            <FiMail size={16} className="footer__contact-icon" />
                            <span>{EDITOR_EMAIL}</span>
                        </a>
                        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="footer__contact-item">
                            <FiInstagram size={16} className="footer__contact-icon footer__contact-icon--ig" />
                            <span>Instagram Profile</span>
                        </a>
                        {YOUTUBE_URL && (
                            <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="footer__contact-item">
                                <FiYoutube size={16} className="footer__contact-icon footer__contact-icon--yt" />
                                <span>YouTube Channel</span>
                            </a>
                        )}
                    </div>

                    <Link to="/order" className="btn btn-primary footer__cta">
                        📽️ Place Order
                    </Link>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="footer__bottom">
                <div className="container footer__bottom-inner">
                    <p className="footer__copy">
                        © {year} {EDITOR_NAME}. All rights reserved.
                    </p>
                    <p className="footer__made">
                        Made with <FiHeart className="footer__heart" size={13} /> for creative work
                    </p>
                </div>
            </div>
        </footer>
    );
}
