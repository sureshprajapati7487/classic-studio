import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiLock, FiMail, FiEye, FiEyeOff, FiUser, FiPhone,
    FiTag, FiBriefcase, FiKey, FiUserPlus, FiLogIn
} from 'react-icons/fi';
import api from '../api';
import toast from 'react-hot-toast';
import './AdminLogin.css';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);
    const [loading, setLoading] = useState(false);

    /* ---------- Login state ---------- */
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });

    /* ---------- Register state ---------- */
    const [regForm, setRegForm] = useState({
        name: '', mobile: '', email: '', username: '',
        brand_name: '', password: '', confirm_password: '', invite_code: '',
    });

    const setL = (field) => (e) => setLoginForm(p => ({ ...p, [field]: e.target.value }));
    const setR = (field) => (e) => setRegForm(p => ({ ...p, [field]: e.target.value }));

    /* ---------- Login submit ---------- */
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginForm.email || !loginForm.password) {
            toast.error('Email aur password dono required hain');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/admin/login', loginForm);
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_email', data.admin.email);
            toast.success('Login successful! Welcome back 👋');
            navigate('/admin/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    /* ---------- Register submit ---------- */
    const handleRegister = async (e) => {
        e.preventDefault();
        const { name, mobile, email, username, brand_name, password, confirm_password, invite_code } = regForm;
        if (!name || !mobile || !email || !username || !brand_name || !password || !confirm_password || !invite_code) {
            toast.error('Saare fields fill karo');
            return;
        }
        if (password !== confirm_password) {
            toast.error('Passwords match nahi kar rahe!');
            return;
        }
        if (password.length < 8) {
            toast.error('Password kam se kam 8 characters ka hona chahiye');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/admin/register', regForm);
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_email', data.admin.email);
            toast.success(data.message || 'Account created! Welcome 🎉');
            navigate('/admin/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login">
            <div className="admin-login__bg">
                <div className="admin-login__bg-orb admin-login__bg-orb--1" />
                <div className="admin-login__bg-orb admin-login__bg-orb--2" />
            </div>

            <div className={`admin-login__card ${mode === 'register' ? 'admin-login__card--wide' : ''}`}>
                {/* Logo */}
                <div className="admin-login__logo">
                    <img src="/logo.png" alt="Classic Studio" style={{ height: 80, width: 'auto', objectFit: 'contain' }} />
                </div>

                {/* Header */}
                <div className="admin-login__header">
                    <div className="admin-login__lock">
                        {mode === 'login' ? <FiLock size={22} /> : <FiUserPlus size={22} />}
                    </div>
                    <h1 className="admin-login__title">
                        {mode === 'login' ? 'Admin Panel' : 'Create Account'}
                    </h1>
                    <p className="admin-login__subtitle">
                        {mode === 'login'
                            ? 'Sign in to manage your orders and portfolio'
                            : 'Register with your invite code to get access'}
                    </p>
                </div>

                {/* Mode toggle tabs */}
                <div className="admin-login__tabs">
                    <button
                        className={`admin-login__tab ${mode === 'login' ? 'admin-login__tab--active' : ''}`}
                        onClick={() => setMode('login')}
                        type="button"
                    >
                        <FiLogIn size={14} /> Sign In
                    </button>
                    <button
                        className={`admin-login__tab ${mode === 'register' ? 'admin-login__tab--active' : ''}`}
                        onClick={() => setMode('register')}
                        type="button"
                    >
                        <FiUserPlus size={14} /> New Account
                    </button>
                </div>

                {/* ===== LOGIN FORM ===== */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin} className="admin-login__form" noValidate>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="admin-login__input-wrap">
                                <FiMail className="admin-login__input-icon" size={16} />
                                <input
                                    type="email"
                                    className="form-input admin-login__input"
                                    placeholder="admin@youremail.com"
                                    value={loginForm.email}
                                    onChange={setL('email')}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="admin-login__input-wrap">
                                <FiLock className="admin-login__input-icon" size={16} />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    className="form-input admin-login__input"
                                    placeholder="Enter your password"
                                    value={loginForm.password}
                                    onChange={setL('password')}
                                    autoComplete="current-password"
                                />
                                <button type="button" className="admin-login__pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                                    {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary admin-login__submit" disabled={loading}>
                            {loading ? <><span className="spinner" /> Signing in...</> : '🔐 Sign In'}
                        </button>
                    </form>
                )}

                {/* ===== REGISTER FORM ===== */}
                {mode === 'register' && (
                    <form onSubmit={handleRegister} className="admin-login__form" noValidate>
                        <div className="admin-reg__grid">
                            {/* Name */}
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <div className="admin-login__input-wrap">
                                    <FiUser className="admin-login__input-icon" size={15} />
                                    <input type="text" className="form-input admin-login__input"
                                        placeholder="Apna pura naam" value={regForm.name} onChange={setR('name')} />
                                </div>
                            </div>

                            {/* Mobile */}
                            <div className="form-group">
                                <label className="form-label">Mobile No. *</label>
                                <div className="admin-login__input-wrap">
                                    <FiPhone className="admin-login__input-icon" size={15} />
                                    <input type="tel" className="form-input admin-login__input"
                                        placeholder="10-digit mobile" maxLength={10}
                                        value={regForm.mobile} onChange={setR('mobile')} />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <div className="admin-login__input-wrap">
                                    <FiMail className="admin-login__input-icon" size={15} />
                                    <input type="email" className="form-input admin-login__input"
                                        placeholder="aapka@email.com" value={regForm.email} onChange={setR('email')} />
                                </div>
                            </div>

                            {/* Username */}
                            <div className="form-group">
                                <label className="form-label">Username *</label>
                                <div className="admin-login__input-wrap">
                                    <FiTag className="admin-login__input-icon" size={15} />
                                    <input type="text" className="form-input admin-login__input"
                                        placeholder="@username" value={regForm.username} onChange={setR('username')} />
                                </div>
                            </div>

                            {/* Brand Name */}
                            <div className="form-group admin-reg__full">
                                <label className="form-label">Brand Name *</label>
                                <div className="admin-login__input-wrap">
                                    <FiBriefcase className="admin-login__input-icon" size={15} />
                                    <input type="text" className="form-input admin-login__input"
                                        placeholder="Aapka brand / studio naam" value={regForm.brand_name} onChange={setR('brand_name')} />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="form-group">
                                <label className="form-label">Password *</label>
                                <div className="admin-login__input-wrap">
                                    <FiLock className="admin-login__input-icon" size={15} />
                                    <input type={showPw ? 'text' : 'password'} className="form-input admin-login__input"
                                        placeholder="Min 8 characters" value={regForm.password} onChange={setR('password')} />
                                    <button type="button" className="admin-login__pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                                        {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="form-group">
                                <label className="form-label">Confirm Password *</label>
                                <div className="admin-login__input-wrap">
                                    <FiLock className="admin-login__input-icon" size={15} />
                                    <input type={showPw2 ? 'text' : 'password'} className="form-input admin-login__input"
                                        placeholder="Password dobara daalo"
                                        value={regForm.confirm_password} onChange={setR('confirm_password')} />
                                    <button type="button" className="admin-login__pw-toggle" onClick={() => setShowPw2(!showPw2)} tabIndex={-1}>
                                        {showPw2 ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Invite Code */}
                            <div className="form-group admin-reg__full">
                                <label className="form-label">Invite / Access Code *</label>
                                <div className="admin-login__input-wrap">
                                    <FiKey className="admin-login__input-icon" size={15} />
                                    <input type="text" className="form-input admin-login__input"
                                        placeholder="Secret invite code" value={regForm.invite_code} onChange={setR('invite_code')}
                                        style={{ letterSpacing: '0.1em', fontWeight: 600 }} />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                    🔒 Sirf authorized users hi account bana sakte hain
                                </p>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary admin-login__submit" disabled={loading}>
                            {loading ? <><span className="spinner" /> Creating account...</> : '🚀 Create Account'}
                        </button>
                    </form>
                )}

                {mode === 'login' && (
                    <div className="admin-login__hint">
                        <p>Default credentials in <code>backend/.env</code></p>
                    </div>
                )}
            </div>
        </div>
    );
}
