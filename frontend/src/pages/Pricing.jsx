import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiArrowRight, FiZap } from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
import './Pricing.css';

const PLANS = [
    {
        id: 'basic',
        name: 'Basic Edit',
        price: 499,
        tag: null,
        icon: '✂️',
        desc: 'Perfect for short videos, simple edits, and social media content.',
        features: [
            'Up to 3 minute video',
            'Basic colour correction',
            'Simple cuts & transitions',
            'Background music sync',
            '1 revision included',
            '3-day delivery',
        ],
        notIncluded: ['Motion graphics', 'SFX & sound design', 'LUT colour grading'],
        color: '#9999aa',
        projectType: 'Basic Edit',
    },
    {
        id: 'advanced',
        name: 'Advanced Edit',
        price: 999,
        tag: 'Most Popular',
        icon: '🎬',
        desc: 'Ideal for YouTube videos, Reels, wedding highlights, and professional content.',
        features: [
            'Up to 10 minute video',
            'Advanced colour correction',
            'Custom transitions & effects',
            'Music sync + SFX',
            'Titles & lower thirds',
            '2 revisions included',
            '5-day delivery',
        ],
        notIncluded: ['Full LUT grading suite', 'Cinematic SFX pack'],
        color: '#d4af37',
        featured: true,
        projectType: 'Advanced Edit',
    },
    {
        id: 'pro',
        name: 'Pro Cinematic',
        price: 1999,
        tag: 'Best Value',
        icon: '🎞️',
        desc: 'For premium films, cinematic wedding videos, and high-end productions.',
        features: [
            'Up to 30 minute video',
            'Full cinematic colour grade',
            'Professional LUT application',
            'Motion graphics & titles',
            'Full SFX + music production',
            'Unlimited revisions',
            '7-day delivery',
            'Priority support',
        ],
        notIncluded: [],
        color: '#c0c0c0',
        projectType: 'Pro Cinematic',
    },
];

const FAQS = [
    { q: 'How do I send my files?', a: 'After placing your order, you can upload files directly in the order form (up to 500MB). For larger files, share via Google Drive or WeTransfer — we will guide you.' },
    { q: 'How long does editing take?', a: 'Delivery time depends on the plan: Basic — 3 days, Advanced — 5 days, Pro — 7 days. Rush delivery available on request.' },
    { q: 'What formats do you deliver?', a: 'We deliver in MP4 (H.264/H.265) at your preferred resolution — 1080p, 4K. For photos, JPEG/PNG at full resolution.' },
    { q: 'Can I request a custom package?', a: 'Absolutely! If your project needs something unique, WhatsApp or email us and we will create a custom quote for you.' },
];

const PLAN_ICONS = { basic: '✂️', advanced: '🎬', pro: '🎞️' };
const PLAN_COLORS = { basic: '#9999aa', advanced: '#d4af37', pro: '#c0c0c0' };

// Get icon for any plan — known IDs first, then keyword matching on name
function getPlanIcon(plan) {
    if (PLAN_ICONS[plan.id]) return PLAN_ICONS[plan.id];
    const n = (plan.name || '').toLowerCase();
    if (n.includes('wedding')) return '💍';
    if (n.includes('reel') || n.includes('short')) return '📱';
    if (n.includes('youtube') || n.includes('vlog')) return '▶️';
    if (n.includes('photo') || n.includes('retouch')) return '📸';
    if (n.includes('color') || n.includes('grade')) return '🎨';
    if (n.includes('cinema')) return '🎞️';
    return '🎬'; // universal fallback
}


export default function Pricing() {
    const { settings } = useSettings();
    const [openFaq, setOpenFaq] = useState(null);

    // Use DB plans, fallback to hardcoded
    const plans = (settings.pricing_plans && settings.pricing_plans.length > 0)
        ? settings.pricing_plans
        : PLANS;
    const whatsapp = settings.whatsapp || '919876543210';

    return (
        <div className="pricing-page page-enter">

            {/* Header */}
            <div className="pricing-header">
                <div className="pricing-header__glow" />
                <div className="container pricing-header__content">
                    <span className="section-label">Transparent Pricing</span>
                    <h1 className="section-title">
                        Simple, <span className="gold-text">Honest Pricing</span>
                    </h1>
                    <div className="gold-divider" />
                    <p className="section-desc">
                        No hidden charges. Choose the plan that fits your project and budget.
                    </p>
                </div>
            </div>

            {/* Plans */}
            <section className="section pricing-section">
                <div className="container">
                    <div className="pricing-grid">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`plan-card ${plan.popular || plan.featured ? 'plan-card--featured' : ''}`}
                            >
                                {(plan.popular || plan.tag) && (
                                    <div className="plan-card__tag">{plan.tag || 'Most Popular'}</div>
                                )}

                                <div className="plan-card__header">
                                    <span className="plan-card__icon">{getPlanIcon(plan)}</span>
                                    <h3 className="plan-card__name">{plan.name}</h3>
                                    {plan.desc && <p className="plan-card__desc">{plan.desc}</p>}
                                </div>

                                <div className="plan-card__price">
                                    <span className="plan-card__currency">₹</span>
                                    <span className="plan-card__amount">{Number(plan.price).toLocaleString('en-IN')}</span>
                                    <span className="plan-card__per">/ project</span>
                                </div>
                                {plan.duration && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', marginTop: -8 }}>🕐 {plan.duration} delivery</p>
                                )}

                                <div className="plan-card__divider" />

                                <ul className="plan-card__features">
                                    {(plan.features || []).map((f, i) => (
                                        <li key={i} className="plan-feature plan-feature--yes">
                                            <FiCheck className="plan-feature__icon plan-feature__icon--yes" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                    {(plan.notIncluded || []).map((f) => (
                                        <li key={f} className="plan-feature plan-feature--no">
                                            <span className="plan-feature__icon plan-feature__icon--no">✕</span>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    to={`/order?plan=${plan.id}&type=${encodeURIComponent(plan.name)}&amount=${plan.price}`}
                                    className={`btn plan-card__btn ${(plan.popular || plan.featured) ? 'btn-primary' : 'btn-outline'}`}
                                >
                                    {(plan.popular || plan.featured) ? <FiZap size={16} /> : <FiArrowRight size={16} />}
                                    Order This Plan
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Note */}
            <div className="container pricing-note">
                <div className="pricing-note__box card-glass">
                    <div>
                        <p>💡 <strong>Custom requirement?</strong> Projects with special requirements (multi-cam, long duration, complex effects) may have custom pricing.{' '}
                            <a href={`https://wa.me/${whatsapp}`}
                                target="_blank" rel="noopener noreferrer" style={{ color: '#25d366' }}>
                                WhatsApp us
                            </a>{' '}for a free quote.
                        </p>
                    </div>
                </div>
            </div>

            {/* FAQ */}
            <section className="section pricing-faq">
                <div className="container">
                    <div className="text-center" style={{ marginBottom: 48 }}>
                        <span className="section-label">Got Questions?</span>
                        <h2 className="section-title">Frequently Asked <span className="gold-text">Questions</span></h2>
                        <div className="gold-divider center" />
                    </div>

                    <div className="faq-list">
                        {FAQS.map(({ q, a }, i) => (
                            <div
                                key={i}
                                className={`faq-item ${openFaq === i ? 'faq-item--open' : ''}`}
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            >
                                <div className="faq-item__q">
                                    <span>{q}</span>
                                    <span className="faq-item__arrow">{openFaq === i ? '−' : '+'}</span>
                                </div>
                                {openFaq === i && (
                                    <div className="faq-item__a">{a}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
}
