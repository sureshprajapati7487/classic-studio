import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiPlay, FiArrowRight, FiAward, FiClock, FiStar,
    FiCheckCircle, FiFilm, FiCamera, FiZap, FiEye
} from 'react-icons/fi';
import { FaWhatsapp, FaInstagram, FaYoutube } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import heroBg from '../assets/hero-bg.png';
import './Home.css';

/* ── Animated counter hook ── */
function useCountUp(target, duration = 1600, startDelay = 0) {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setStarted(true), startDelay);
        return () => clearTimeout(timer);
    }, [startDelay]);
    useEffect(() => {
        if (!started) return;
        const numeric = parseInt(target.replace(/\D/g, ''), 10);
        if (!numeric) return;
        const step = Math.max(1, Math.ceil(numeric / (duration / 16)));
        let current = 0;
        const id = setInterval(() => {
            current = Math.min(current + step, numeric);
            setCount(current);
            if (current >= numeric) clearInterval(id);
        }, 16);
        return () => clearInterval(id);
    }, [started, target, duration]);
    return count;
}

/* ── Particle component ── */
function HeroParticles() {
    return (
        <div className="hero__particles" aria-hidden="true">
            {[...Array(24)].map((_, i) => (
                <div key={i} className="hero__particle" style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 8}s`,
                    animationDuration: `${6 + Math.random() * 6}s`,
                    width: `${2 + Math.random() * 3}px`,
                    height: `${2 + Math.random() * 3}px`,
                    opacity: 0.2 + Math.random() * 0.5,
                }} />
            ))}
        </div>
    );
}

/* ── Stat with animated counter ── */
function AnimatedStat({ icon, value, label, delay }) {
    const numeric = parseInt(value.replace(/\D/g, ''), 10);
    const suffix = value.replace(/[\d]/g, '').trim();
    const count = useCountUp(value, 1800, delay);
    return (
        <div className="hero__stat">
            <span className="hero__stat-icon">{icon}</span>
            <strong className="hero__stat-value">
                {numeric ? `${count}${suffix}` : value}
            </strong>
            <span className="hero__stat-label">{label}</span>
        </div>
    );
}

const STATS = [
    { icon: <FiFilm />, value: '500+', label: 'Projects Done' },
    { icon: <FiStar />, value: '5★', label: 'Client Rating' },
    { icon: <FiClock />, value: '3yrs', label: 'Experience' },
    { icon: <FiCheckCircle />, value: '100%', label: 'Satisfaction' },
];

const SERVICES = [
    { emoji: '💍', title: 'Wedding Edit', desc: 'Emotional cinematic wedding highlights that you will cherish forever.', color: '#c084fc' },
    { emoji: '🎬', title: 'Reels & Shorts', desc: 'Viral-ready Reels and YouTube Shorts with trending cuts and transitions.', color: '#f472b6' },
    { emoji: '▶️', title: 'YouTube Edits', desc: 'Professional YouTube video editing — engaging, clean, and well-paced.', color: '#fb923c' },
    { emoji: '📸', title: 'Photo Retouch', desc: 'Skin smoothing, colour correction, and background edits done beautifully.', color: '#34d399' },
    { emoji: '🎨', title: 'Color Grading', desc: 'Cinematic LUT-based colour grading that gives a premium Hollywood look.', color: '#d4af37' },
    { emoji: '🎞️', title: 'Cinematic Edit', desc: 'Full cinematic productions with SFX, music sync, and dramatic storytelling.', color: '#60a5fa' },
];

const SAMPLE_WORKS = [
    { id: 1, title: 'Wedding Highlight', category: 'Wedding', gradient: 'linear-gradient(135deg,#3d0f0f,#1a0000)', icon: '💍' },
    { id: 2, title: 'Instagram Reel', category: 'Reels', gradient: 'linear-gradient(135deg,#1a003d,#0a0020)', icon: '📱' },
    { id: 3, title: 'YouTube Vlog', category: 'YouTube', gradient: 'linear-gradient(135deg,#003d0f,#001a00)', icon: '▶️' },
    { id: 4, title: 'Portrait Retouch', category: 'Photo', gradient: 'linear-gradient(135deg,#3d003d,#1a0020)', icon: '📸' },
    { id: 5, title: 'Cinematic Short', category: 'Cinematic', gradient: 'linear-gradient(135deg,#2a2a00,#1a1000)', icon: '🎬' },
    { id: 6, title: 'Color Grade Demo', category: 'Color', gradient: 'linear-gradient(135deg,#003d3d,#001a2a)', icon: '🎨' },
];

const TESTIMONIALS = [
    { name: 'Rahul Sharma', role: 'Wedding Client', text: 'The highlight reel made our guests cry happy tears. Absolutely stunning work!', stars: 5 },
    { name: 'Priya Mehta', role: 'Content Creator', text: 'My Reels engagement went 3x after switching to this editor. Game changer!', stars: 5 },
    { name: 'Anil Kumar', role: 'Business Owner', text: 'Professional, fast, and always exceed expectations. Highly recommended.', stars: 5 },
];

export default function Home() {
    const { settings } = useSettings();
    const WHATSAPP_NUMBER = settings.whatsapp || '919876543210';
    const INSTAGRAM_URL = settings.instagram || 'https://instagram.com/yourprofile';
    const YOUTUBE_URL = settings.youtube || '';

    return (
        <div className="home page-enter">

            {/* ══════ HERO ══════ */}
            <section className="hero">
                <div className="hero__bg" style={{ backgroundImage: `url(${heroBg})` }} />
                <div className="hero__overlay" />
                <HeroParticles />

                {/* Floating gold orb */}
                <div className="hero__orb hero__orb--1" aria-hidden="true" />
                <div className="hero__orb hero__orb--2" aria-hidden="true" />

                <div className="container hero__content">
                    <div className="hero__badge animate-fade-in">
                        <span className="badge badge-gold">✦ Professional Editor</span>
                    </div>

                    <h1 className="hero__title">
                        Turning Your Moments Into
                        <br />
                        <span className="gold-text-animated">Cinematic Masterpieces</span>
                    </h1>

                    <p className="hero__desc">
                        Wedding edits, Reels, YouTube videos, Photo retouching &amp; Cinematic color grading —
                        delivered with precision and passion.
                    </p>

                    <div className="hero__actions">
                        <Link to="/order" className="btn btn-primary hero__btn-primary">
                            <FiPlay size={16} />
                            Order Now
                        </Link>
                        <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}`}
                            target="_blank" rel="noopener noreferrer"
                            className="btn hero__btn-wa"
                        >
                            <FaWhatsapp size={18} />
                            Chat on WhatsApp
                        </a>
                        <Link to="/portfolio" className="btn btn-outline">
                            View Portfolio <FiArrowRight size={15} />
                        </Link>
                    </div>

                    <div className="hero__stats">
                        {STATS.map(({ icon, value, label }, i) => (
                            <AnimatedStat key={label} icon={icon} value={value} label={label} delay={300 + i * 150} />
                        ))}
                    </div>
                </div>

                <div className="hero__scroll" aria-hidden="true">
                    <span className="hero__scroll-text">Scroll</span>
                    <div className="hero__scroll-dot" />
                </div>
            </section>

            {/* ══════ SAMPLE WORKS ══════ */}
            <section className="section home-works">
                <div className="container">
                    <div className="text-center" style={{ marginBottom: 60 }}>
                        <span className="section-label">Latest Work</span>
                        <h2 className="section-title">Sample <span className="gold-text">Portfolio</span></h2>
                        <div className="gold-divider center" />
                        <p className="section-desc" style={{ margin: '0 auto' }}>
                            A glimpse of our recent projects — every frame crafted with care.
                        </p>
                    </div>

                    <div className="works-grid stagger">
                        {SAMPLE_WORKS.map((work) => (
                            <Link to="/portfolio" key={work.id} className="work-card" style={{ background: work.gradient }}>
                                {/* Noise overlay */}
                                <div className="work-card__noise" aria-hidden="true" />
                                <div className="work-card__inner">
                                    <div className="work-card__play">
                                        <FiPlay size={22} />
                                    </div>
                                    <div className="work-card__hover-overlay" aria-hidden="true">
                                        <FiEye size={20} />
                                        <span>View Work</span>
                                    </div>
                                    <div className="work-card__info">
                                        <span className="badge badge-gold">{work.category}</span>
                                        <h3 className="work-card__title">{work.title}</h3>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="text-center mt-32">
                        <Link to="/portfolio" className="btn btn-outline">
                            View Full Portfolio <FiArrowRight size={15} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ══════ SERVICES ══════ */}
            <section className="section home-services">
                <div className="container">
                    <div className="text-center" style={{ marginBottom: 60 }}>
                        <span className="section-label">What I Do</span>
                        <h2 className="section-title">Premium <span className="gold-text">Services</span></h2>
                        <div className="gold-divider center" />
                    </div>

                    <div className="services-grid">
                        {SERVICES.map(({ emoji, title, desc, color }, idx) => (
                            <div
                                key={title}
                                className="service-card card"
                                style={{ '--service-color': color }}
                            >
                                <div className="service-card__num">0{idx + 1}</div>
                                <div className="service-card__icon">{emoji}</div>
                                <h3 className="service-card__title">{title}</h3>
                                <p className="service-card__desc">{desc}</p>
                                <div className="service-card__bar" aria-hidden="true" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════ TESTIMONIALS ══════ */}
            <section className="section home-testimonials">
                <div className="container">
                    <div className="text-center" style={{ marginBottom: 56 }}>
                        <span className="section-label">Client Love</span>
                        <h2 className="section-title">What Clients <span className="gold-text">Say</span></h2>
                        <div className="gold-divider center" />
                    </div>
                    <div className="testimonials-grid">
                        {TESTIMONIALS.map(({ name, role, text, stars }) => (
                            <div key={name} className="testimonial-card card">
                                <div className="testimonial-card__stars">
                                    {'★'.repeat(stars)}
                                </div>
                                <p className="testimonial-card__text">"{text}"</p>
                                <div className="testimonial-card__author">
                                    <div className="testimonial-card__avatar">
                                        {name.charAt(0)}
                                    </div>
                                    <div>
                                        <strong className="testimonial-card__name">{name}</strong>
                                        <span className="testimonial-card__role">{role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════ PRICING TEASER ══════ */}
            <section className="section home-pricing-teaser">
                <div className="container">
                    <div className="pricing-teaser">
                        <div className="pricing-teaser__content">
                            <span className="section-label">Affordable Pricing</span>
                            <h2 className="section-title">
                                Starting at just <span className="gold-text">₹499</span>
                            </h2>
                            <p className="section-desc">
                                Professional editing at prices that don't break your budget. Basic to Pro — we have a plan for everyone.
                            </p>
                            <div className="pricing-teaser__actions">
                                <Link to="/pricing" className="btn btn-primary">
                                    See All Plans <FiArrowRight size={15} />
                                </Link>
                                <Link to="/order" className="btn btn-outline">
                                    Place Order
                                </Link>
                            </div>
                        </div>
                        {/* Dynamic pricing teaser from DB settings */}
                        <div className="pricing-teaser__cards">
                            {((settings.pricing_plans && settings.pricing_plans.length > 0)
                                ? settings.pricing_plans.slice(0, 3)
                                : [
                                    { id: 'basic', name: 'Basic', price: 499, popular: false },
                                    { id: 'advanced', name: 'Advanced', price: 999, popular: true },
                                    { id: 'pro', name: 'Pro', price: 1999, popular: false },
                                ]
                            ).map(({ id, name, price, popular, featured }) => {
                                const isFeatured = popular || featured;
                                const color = id === 'advanced' ? '#d4af37' : id === 'pro' ? '#e0e0e0' : '#8888aa';
                                return (
                                    <div key={id} className={`mini-price-card ${isFeatured ? 'mini-price-card--featured' : ''}`}>
                                        <span style={{ color, fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{name}</span>
                                        <strong style={{ color: isFeatured ? '#d4af37' : 'var(--text-primary)', fontSize: '1.6rem', fontFamily: 'var(--font-heading)', display: 'block', marginTop: 8 }}>₹{Number(price).toLocaleString('en-IN')}</strong>
                                        {isFeatured && <span style={{ fontSize: '0.68rem', color: '#d4af37', fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '0.08em' }}>POPULAR</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════ CTA BANNER ══════ */}
            <section className="section home-cta">
                <div className="container">
                    <div className="cta-banner">
                        <div className="cta-banner__glow" />
                        <div className="cta-banner__lines" aria-hidden="true" />
                        <div className="cta-banner__content">
                            <span className="section-label" style={{ justifyContent: 'center' }}>Ready?</span>
                            <h2 className="cta-banner__title">
                                Ready to Make Your <span className="gold-text">Vision a Reality?</span>
                            </h2>
                            <p className="cta-banner__desc">
                                Place your order today. Fill a simple form, upload your files, and sit
                                back while we work our magic.
                            </p>
                            <div className="cta-banner__actions">
                                <Link to="/order" className="btn btn-primary">
                                    <FiZap size={16} /> Place Your Order
                                </Link>
                                <a
                                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I want to discuss a video/photo editing project.`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="btn hero__btn-wa"
                                >
                                    <FaWhatsapp size={18} /> WhatsApp Me
                                </a>
                            </div>
                            <div className="cta-banner__social">
                                {INSTAGRAM_URL && INSTAGRAM_URL !== 'https://instagram.com/yourprofile' && (
                                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                        <FaInstagram size={18} />
                                    </a>
                                )}
                                {YOUTUBE_URL && (
                                    <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                        <FaYoutube size={18} />
                                    </a>
                                )}
                                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                    <FaWhatsapp size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
