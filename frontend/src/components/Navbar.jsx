import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiInstagram, FiMail, FiYoutube } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import './Navbar.css';

const NAV_LINKS = [
    { path: '/', label: 'Home' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/order', label: 'Order' },
    { path: '/contact', label: 'Contact' },
];

export default function Navbar() {
    const { settings } = useSettings();
    const WHATSAPP_NUMBER = settings.whatsapp || '919876543210';
    const INSTAGRAM_URL = settings.instagram || '#';
    const EDITOR_EMAIL = settings.email || '#';
    const YOUTUBE_URL = settings.youtube || '';
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef(null);
    const location = useLocation();

    // Close menu on route change
    useEffect(() => { setIsOpen(false); }, [location]);

    // Scroll detection for blur effect
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Prevent body scroll when mobile menu open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="container navbar__inner" ref={menuRef}>

                {/* Logo — falls back to text if /logo.png is missing */}
                <Link to="/" className="navbar__logo">
                    <img
                        src="/logo.png"
                        alt="Classic Studio"
                        className="navbar__logo-img"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                    />
                    <span className="navbar__logo-text" style={{ display: 'none' }}>
                        {settings.studio_name || 'Classic Studio'}
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="navbar__links" aria-label="Main navigation">
                    {NAV_LINKS.map(({ path, label }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/'}
                            className={({ isActive }) =>
                                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Desktop CTA */}
                <div className="navbar__actions">
                    <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="navbar__wa-btn"
                        aria-label="WhatsApp"
                    >
                        <FaWhatsapp size={16} />
                        WhatsApp
                    </a>
                    <Link to="/order" className="btn btn-primary navbar__order-btn">
                        Order Now
                    </Link>
                </div>

                {/* Hamburger */}
                <button
                    className={`navbar__hamburger ${isOpen ? 'navbar__hamburger--open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={isOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isOpen}
                >
                    {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                </button>
            </div>

            {/* Mobile Drawer */}
            <div className={`navbar__drawer ${isOpen ? 'navbar__drawer--open' : ''}`} aria-hidden={!isOpen}>
                <nav className="navbar__drawer-links">
                    {NAV_LINKS.map(({ path, label }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/'}
                            className={({ isActive }) =>
                                `navbar__drawer-link ${isActive ? 'navbar__drawer-link--active' : ''}`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Mobile social row */}
                <div className="navbar__drawer-social">
                    <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}`}
                        target="_blank" rel="noopener noreferrer"
                        className="navbar__social-icon"
                        aria-label="WhatsApp"
                    >
                        <FaWhatsapp size={20} />
                    </a>
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
                        className="navbar__social-icon" aria-label="Instagram">
                        <FiInstagram size={20} />
                    </a>
                    {YOUTUBE_URL && (
                        <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer"
                            className="navbar__social-icon" aria-label="YouTube"
                            style={{ color: '#ff0000' }}>
                            <FiYoutube size={20} />
                        </a>
                    )}
                    <a href={`mailto:${EDITOR_EMAIL}`} className="navbar__social-icon" aria-label="Email">
                        <FiMail size={20} />
                    </a>
                </div>

                <Link to="/order" className="btn btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                    Order Now
                </Link>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="navbar__overlay"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}
        </header>
    );
}
