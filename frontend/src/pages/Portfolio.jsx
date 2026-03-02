import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    FiPlay, FiImage, FiArrowRight, FiX, FiMaximize, FiMinimize,
    FiVolume2, FiVolumeX, FiPause
} from 'react-icons/fi';
import api from '../api';
import './Portfolio.css';

const CATEGORIES = [
    { id: 'all', label: '✦ All Work' },
    { id: 'wedding', label: '💍 Wedding Edit' },
    { id: 'reels', label: '🎬 Reels & Shorts' },
    { id: 'youtube', label: '▶️ YouTube Edits' },
    { id: 'photo', label: '📸 Photo Retouch' },
    { id: 'color', label: '🎨 Color Grading' },
    { id: 'cinematic', label: '🎞️ Cinematic Edit' },
];

const PLACEHOLDER_ITEMS = [
    { id: 1, category: 'wedding', title: 'Royal Wedding Highlight', file_type: 'video', gradient: 'linear-gradient(135deg,#1a0a00,#4d2600)', price: null, file_path: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 2, category: 'wedding', title: 'Intimate Beach Wedding', file_type: 'video', gradient: 'linear-gradient(135deg,#001020,#003060)', price: null, file_path: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 3, category: 'reels', title: 'Travel Reel — Goa', file_type: 'video', gradient: 'linear-gradient(135deg,#0a1a00,#204d00)', price: null, file_path: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 4, category: 'reels', title: 'Product Launch Reel', file_type: 'video', gradient: 'linear-gradient(135deg,#1a000a,#4d0026)', price: null, file_path: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 5, category: 'youtube', title: 'Tech Review Edit', file_type: 'video', gradient: 'linear-gradient(135deg,#001a1a,#004d4d)', price: null, file_path: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 6, category: 'photo', title: 'Bridal Portrait Retouch', file_type: 'image', gradient: 'linear-gradient(135deg,#1a001a,#4d004d)', price: null, file_path: 'https://via.placeholder.com/1280x720.png?text=Photo+Retouch' },
    { id: 7, category: 'color', title: 'Orange & Teal Grade', file_type: 'video', gradient: 'linear-gradient(135deg,#1a0800,#ff4d00)', price: null, file_path: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 8, category: 'cinematic', title: 'Short Film — Monsoon', file_type: 'video', gradient: 'linear-gradient(135deg,#000a1a,#00264d)', price: null, file_path: 'https://www.w3schools.com/html/mov_bbb.mp4' },
];

// Utility: format seconds to mm:ss
function fmtTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ── Premium Video Player Component ──────────────────────────
function PremiumVideoPlayer({ src, title, is4k }) {
    const videoRef = useRef(null);
    const progressRef = useRef(null);
    const containerRef = useRef(null);
    const hideTimer = useRef(null);

    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [buffering, setBuffering] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [seeking, setSeeking] = useState(false);

    // Show controls temporarily then hide during play
    const showControls = useCallback(() => {
        setControlsVisible(true);
        clearTimeout(hideTimer.current);
        if (playing && !seeking) {
            hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
        }
    }, [playing, seeking]);

    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;

        const onPlay = () => setPlaying(true);
        const onPause = () => { setPlaying(false); setControlsVisible(true); };
        const onTimeUpdate = () => setCurrentTime(vid.currentTime);
        const onDuration = () => setDuration(vid.duration);
        const onWaiting = () => setBuffering(true);
        const onCanPlay = () => setBuffering(false);
        const onVolumeChange = () => { setVolume(vid.volume); setMuted(vid.muted); };
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);

        vid.addEventListener('play', onPlay);
        vid.addEventListener('pause', onPause);
        vid.addEventListener('timeupdate', onTimeUpdate);
        vid.addEventListener('loadedmetadata', onDuration);
        vid.addEventListener('waiting', onWaiting);
        vid.addEventListener('canplay', onCanPlay);
        vid.addEventListener('volumechange', onVolumeChange);
        document.addEventListener('fullscreenchange', onFsChange);

        return () => {
            vid.removeEventListener('play', onPlay);
            vid.removeEventListener('pause', onPause);
            vid.removeEventListener('timeupdate', onTimeUpdate);
            vid.removeEventListener('loadedmetadata', onDuration);
            vid.removeEventListener('waiting', onWaiting);
            vid.removeEventListener('canplay', onCanPlay);
            vid.removeEventListener('volumechange', onVolumeChange);
            document.removeEventListener('fullscreenchange', onFsChange);
            clearTimeout(hideTimer.current);
        };
    }, []);

    // Auto-play + auto-fullscreen on mount
    useEffect(() => {
        const vid = videoRef.current;
        const container = containerRef.current;
        if (vid) {
            vid.play().catch(() => { });
        }
        // Request fullscreen on the player container
        if (container) {
            const req = container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen;
            if (req) {
                setTimeout(() => req.call(container).catch(() => { }), 120);
            }
        }
    }, [src]);

    // Keyboard shortcuts
    useEffect(() => {
        const onKey = (e) => {
            const vid = videoRef.current;
            if (!vid) return;
            showControls();
            switch (e.code) {
                case 'Space': e.preventDefault(); vid.paused ? vid.play() : vid.pause(); break;
                case 'ArrowRight': e.preventDefault(); vid.currentTime = Math.min(vid.duration, vid.currentTime + 10); break;
                case 'ArrowLeft': e.preventDefault(); vid.currentTime = Math.max(0, vid.currentTime - 10); break;
                case 'KeyM': vid.muted = !vid.muted; break;
                case 'KeyF': toggleFullscreen(); break;
                default: break;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showControls]);

    const togglePlay = () => {
        const vid = videoRef.current;
        if (!vid) return;
        vid.paused ? vid.play() : vid.pause();
    };

    const toggleMute = () => {
        const vid = videoRef.current;
        if (!vid) return;
        vid.muted = !vid.muted;
    };

    const handleVolumeChange = (e) => {
        const vid = videoRef.current;
        if (!vid) return;
        const v = parseFloat(e.target.value);
        vid.volume = v;
        vid.muted = v === 0;
    };

    const handleProgressClick = (e) => {
        const vid = videoRef.current;
        const bar = progressRef.current;
        if (!vid || !bar || !duration) return;
        const rect = bar.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        vid.currentTime = pct * duration;
    };

    const toggleFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div
            className={`pvp-container ${isFullscreen ? 'pvp-fullscreen' : ''}`}
            ref={containerRef}
            onMouseMove={showControls}
            onMouseLeave={() => playing && setControlsVisible(false)}
        >
            {/* ── Video element ── */}
            <video
                ref={videoRef}
                src={src}
                className="pvp-video"
                preload="auto"
                playsInline
                onClick={togglePlay}
            />

            {/* ── Buffering Spinner ── */}
            {buffering && (
                <div className="pvp-buffering">
                    <div className="pvp-spinner" />
                </div>
            )}

            {/* ── Center play/pause flash ── */}
            {!buffering && !playing && (
                <div className="pvp-center-play" onClick={togglePlay}>
                    <div className="pvp-center-play__ring">
                        <FiPlay size={32} />
                    </div>
                </div>
            )}

            {/* ── Quality Badge ── */}
            {is4k && (
                <div className="pvp-quality-badge">4K</div>
            )}

            {/* ── Controls overlay ── */}
            <div className={`pvp-controls ${controlsVisible ? 'pvp-controls--visible' : ''}`}>

                {/* Progress bar */}
                <div
                    className="pvp-progress"
                    ref={progressRef}
                    onClick={handleProgressClick}
                >
                    <div className="pvp-progress__track">
                        <div className="pvp-progress__fill" style={{ width: `${progress}%` }} />
                        <div className="pvp-progress__thumb" style={{ left: `${progress}%` }} />
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pvp-bar">
                    {/* Left */}
                    <div className="pvp-bar__left">
                        <button className="pvp-btn" onClick={togglePlay} title={playing ? 'Pause (Space)' : 'Play (Space)'}>
                            {playing ? <FiPause size={18} /> : <FiPlay size={18} />}
                        </button>

                        {/* Volume group */}
                        <div className="pvp-vol-group">
                            <button className="pvp-btn" onClick={toggleMute} title="Mute (M)">
                                {muted || volume === 0 ? <FiVolumeX size={17} /> : <FiVolume2 size={17} />}
                            </button>
                            <input
                                type="range"
                                className="pvp-vol-slider"
                                min={0} max={1} step={0.05}
                                value={muted ? 0 : volume}
                                onChange={handleVolumeChange}
                            />
                        </div>

                        <span className="pvp-time">
                            {fmtTime(currentTime)} / {fmtTime(duration)}
                        </span>
                    </div>

                    {/* Right */}
                    <div className="pvp-bar__right">
                        <span className="pvp-hint">← → 10s  |  Space Play</span>
                        <button className="pvp-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
                            {isFullscreen ? <FiMinimize size={17} /> : <FiMaximize size={17} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Portfolio Page ──────────────────────────────────────
export default function Portfolio() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredId, setHoveredId] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        api.get('/api/portfolio')
            .then(({ data }) => setItems(data.items?.length > 0 ? data.items : PLACEHOLDER_ITEMS))
            .catch(() => setItems(PLACEHOLDER_ITEMS))
            .finally(() => setLoading(false));
    }, []);

    // Lock scroll & Escape to close
    useEffect(() => {
        if (!selectedItem) return;
        document.body.style.overflow = 'hidden';
        const onEsc = (e) => { if (e.key === 'Escape') setSelectedItem(null); };
        window.addEventListener('keydown', onEsc);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onEsc);
        };
    }, [selectedItem]);

    const filtered = activeCategory === 'all'
        ? items
        : items.filter(i => i.category === activeCategory);

    // Trigger re-mount animation when category changes
    const [gridKey, setGridKey] = useState('all');
    useEffect(() => {
        setGridKey(activeCategory + Date.now());
    }, [activeCategory]);

    // Determine if 4K (file_size > 500MB OR original_name contains "4k/4K/2160")
    const is4k = (item) => {
        if (!item) return false;
        if (item.file_size && item.file_size > 500 * 1024 * 1024) return true;
        if (item.original_name && /4k|4K|2160/i.test(item.original_name)) return true;
        return false;
    };

    return (
        <div className="portfolio-page page-enter">

            {/* Header */}
            <div className="portfolio-header">
                <div className="portfolio-header__bg" />
                <div className="container portfolio-header__content">
                    <span className="section-label">Creative Work</span>
                    <h1 className="section-title">My <span className="gold-text">Portfolio</span></h1>
                    <div className="gold-divider" />
                    <p className="section-desc">Every project tells a story. Browse through my work across different categories.</p>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="portfolio-tabs-wrap">
                <div className="container">
                    <div className="portfolio-tabs">
                        {CATEGORIES.map(({ id, label }) => (
                            <button
                                key={id}
                                className={`portfolio-tab ${activeCategory === id ? 'portfolio-tab--active' : ''}`}
                                onClick={() => setActiveCategory(id)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <section className="section portfolio-section">
                <div className="container">
                    <p className="portfolio-count">
                        Showing <strong>{filtered.length}</strong> works
                        {activeCategory !== 'all' && ` in "${CATEGORIES.find(c => c.id === activeCategory)?.label}"`}
                    </p>

                    {loading ? (
                        <div className="portfolio-loading">
                            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
                            <p>Loading portfolio...</p>
                        </div>
                    ) : (
                        <div className="portfolio-grid" key={gridKey}>
                            {filtered.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className={`portfolio-card ${idx === 0 && filtered.length >= 3 ? 'portfolio-card--featured' : ''} ${hoveredId === item.id ? 'portfolio-card--hovered' : ''}`}
                                    style={{
                                        background: item.gradient || 'var(--bg-card)',
                                        animationDelay: `${idx * 0.07}s`,
                                    }}
                                    onMouseEnter={() => setHoveredId(item.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => item.file_path && setSelectedItem(item)}
                                >
                                    {/* Media */}
                                    {item.file_type === 'video' ? (
                                        <video
                                            src={item.file_path}
                                            className="portfolio-card__media"
                                            muted loop playsInline preload="metadata"
                                            onMouseEnter={e => e.target.play()}
                                            onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                                        />
                                    ) : (
                                        <img
                                            src={item.file_path}
                                            alt={item.title}
                                            className="portfolio-card__media"
                                            loading="lazy"
                                        />
                                    )}

                                    {/* Always-on gradient overlay */}
                                    <div className="portfolio-card__gradient" />

                                    {/* Top badges row */}
                                    <div className="portfolio-card__badges">
                                        <span className="portfolio-card__type-badge">
                                            {item.file_type === 'video' ? '🎬 Video' : '📸 Photo'}
                                        </span>
                                        {is4k(item) && <span className="portfolio-card__4k">4K</span>}
                                    </div>

                                    {/* Center play button — always visible, glows on hover */}
                                    <div className="portfolio-card__center">
                                        <div className="portfolio-card__play-ring">
                                            {item.file_type === 'video'
                                                ? <FiPlay size={22} style={{ marginLeft: 3 }} />
                                                : <FiImage size={20} />}
                                        </div>
                                    </div>

                                    {/* Bottom info — always visible title, hover expands */}
                                    <div className="portfolio-card__foot">
                                        <div className="portfolio-card__foot-top">
                                            <h3 className="portfolio-card__title">{item.title}</h3>
                                            {item.price != null && item.price > 0 && (
                                                <span className="portfolio-card__price">
                                                    ₹{Number(item.price).toLocaleString('en-IN')}
                                                </span>
                                            )}
                                            {(item.price === 0 || item.price === null) && (
                                                <span className="portfolio-card__price portfolio-card__price--free">
                                                    On Request
                                                </span>
                                            )}
                                        </div>
                                        <div className="portfolio-card__foot-reveal">
                                            {item.description && (
                                                <p className="portfolio-card__desc">{item.description}</p>
                                            )}
                                            <Link
                                                to={`/order?type=${encodeURIComponent(item.category)}&amount=${item.price || 0}`}
                                                className="portfolio-card__cta"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <FiArrowRight size={14} />
                                                {item.price > 0 ? `Order – ₹${Number(item.price).toLocaleString('en-IN')}` : 'Get Free Quote'}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && filtered.length === 0 && (
                        <div className="portfolio-empty">
                            <p>No items in this category yet. Check back soon! 🎬</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ════════ PREMIUM LIGHTBOX MODAL ════════ */}
            {selectedItem && (
                <div className="plb-overlay" onClick={() => {
                    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => { });
                    setSelectedItem(null);
                }}>
                    <div className="plb-box" onClick={e => e.stopPropagation()}>

                        {/* Close button */}
                        <button className="plb-close" onClick={() => {
                            if (document.fullscreenElement) document.exitFullscreen?.().catch(() => { });
                            setSelectedItem(null);
                        }}>
                            <FiX size={20} />
                        </button>

                        {/* Video Player OR Image */}
                        {selectedItem.file_type === 'video' ? (
                            <PremiumVideoPlayer
                                key={selectedItem.id}
                                src={selectedItem.file_path}
                                title={selectedItem.title}
                                is4k={is4k(selectedItem)}
                            />
                        ) : (
                            <div className="plb-image-wrap">
                                <img
                                    src={selectedItem.file_path}
                                    alt={selectedItem.title}
                                    className="plb-image"
                                />
                            </div>
                        )}

                        {/* Info bar */}
                        <div className="plb-info">
                            <div className="plb-info__left">
                                <h3 className="plb-title">{selectedItem.title}</h3>
                                {selectedItem.description && (
                                    <p className="plb-desc">{selectedItem.description}</p>
                                )}
                            </div>
                            <Link
                                to={`/order?type=${encodeURIComponent(selectedItem.category)}&amount=${selectedItem.price || 0}`}
                                className="btn btn-primary plb-order-btn"
                                onClick={() => setSelectedItem(null)}
                            >
                                {selectedItem.price > 0
                                    ? `Order – ₹${Number(selectedItem.price).toLocaleString('en-IN')}`
                                    : '📋 Get Quote'}
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
