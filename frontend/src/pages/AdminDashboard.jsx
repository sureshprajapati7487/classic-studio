import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiLogOut, FiPackage, FiMessageSquare, FiImage, FiSettings,
    FiRefreshCw, FiUpload, FiTrash2, FiX, FiCheck, FiSave, FiPlus,
    FiClock, FiDollarSign, FiAlertCircle, FiChevronDown, FiEye, FiEyeOff,
    FiSearch, FiFilter, FiPlay
} from 'react-icons/fi';
import api from '../api'; // shared axios instance (auth interceptor already set)
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import './AdminDashboard.css';

const TABS = [
    { id: 'orders', label: 'Orders', icon: <FiPackage /> },
    { id: 'messages', label: 'Messages', icon: <FiMessageSquare /> },
    { id: 'portfolio', label: 'Portfolio', icon: <FiImage /> },
    { id: 'settings', label: 'Settings', icon: <FiSettings /> },
];

const STATUS_COLORS = {
    pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Pending' },
    in_progress: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', label: 'In Progress' },
    done: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', label: 'Done' },
    cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Cancelled' },
};

const PAYMENT_COLORS = {
    paid: { color: '#22c55e', label: '✅ Paid' },
    unpaid: { color: '#f59e0b', label: '⏳ Unpaid' },
};

const PORTFOLIO_CATEGORIES = [
    'wedding', 'reels', 'youtube', 'photo', 'color', 'cinematic'
];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { settings: ctxSettings, setSettings: setCtxSettings } = useSettings();
    const [tab, setTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [messages, setMessages] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [portfolioForm, setPortfolioForm] = useState({ title: '', category: 'wedding', description: '', price: '' });
    const [portfolioFile, setPortfolioFile] = useState(null);
    const [editPrices, setEditPrices] = useState({}); // { [itemId]: price string while editing }
    const [savingPrice, setSavingPrice] = useState(null); // item id currently being saved
    const [siteSettings, setSiteSettings] = useState(ctxSettings);
    const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [changingPw, setChangingPw] = useState(false);
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [showRzpSecret, setShowRzpSecret] = useState(false);
    const [adminsList, setAdminsList] = useState([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [resetPwMap, setResetPwMap] = useState({}); // { [adminId]: password value }
    const [inviteCode, setInviteCode] = useState('');
    const [savingInviteCode, setSavingInviteCode] = useState(false);
    // Orders search & filter
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('all');
    const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
    const [orderPage, setOrderPage] = useState(1);
    const ORDERS_PER_PAGE = 10;
    // Portfolio video play state
    const [playingVideos, setPlayingVideos] = useState({}); // { [itemId]: bool }


    // Auth guard
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { navigate('/admin/login'); return; }
        loadAll();
    }, []);

    // Sync local settings state when context loads
    useEffect(() => { setSiteSettings(ctxSettings); }, [ctxSettings]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [ordersRes, messagesRes, portfolioRes] = await Promise.all([
                api.get('/admin/orders'),
                api.get('/admin/messages'),
                api.get('/portfolio'),
            ]);
            setOrders(ordersRes.data.orders || []);
            setStats(ordersRes.data.stats || {});
            setMessages(messagesRes.data.messages || []);
            setPortfolio(portfolioRes.data.items || []);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('admin_token');
                navigate('/admin/login');
            } else {
                toast.error('Failed to load data');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_email');
        navigate('/admin/login');
        toast.success('Logged out successfully');
    };

    const updateOrderStatus = async (id, status) => {
        try {
            // Using /admin/orders/:id/status — verifyToken middleware protected route
            await api.patch(`/admin/orders/${id}/status`, { status });
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
            toast.success(`Order #${id} marked as "${STATUS_COLORS[status].label}"`);
        } catch {
            toast.error('Failed to update order status');
        }
    };

    const deleteOrder = async (id) => {
        if (!window.confirm(`Order #${id} permanently delete karna chahte ho? Yeh wapas nahi aayega!`)) return;
        try {
            await api.delete(`/admin/orders/${id}`);
            setOrders(prev => {
                const remaining = prev.filter(o => o.id !== id);
                // Recalculate all stats from remaining orders
                const total = remaining.length;
                const pending = remaining.filter(o => o.status === 'pending').length;
                const done = remaining.filter(o => o.status === 'done').length;
                const revenue = remaining
                    .filter(o => o.payment_status === 'paid')
                    .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
                setStats(s => ({ ...s, total, pending, done, revenue }));
                return remaining;
            });
            toast.success(`Order #${id} delete ho gaya`);
        } catch {
            toast.error('Order delete karne mein problem aayi');
        }
    };

    const markMessageRead = async (id) => {
        try {
            await api.patch(`/admin/messages/${id}/read`);
            setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
        } catch { /* silent */ }
    };

    const deletePortfolioItem = async (id) => {
        if (!window.confirm('Delete this portfolio item?')) return;
        try {
            await api.delete(`/portfolio/${id}`);
            setPortfolio(prev => prev.filter(p => p.id !== id));
            toast.success('Portfolio item deleted');
        } catch {
            toast.error('Failed to delete item');
        }
    };

    const uploadPortfolio = async (e) => {
        e.preventDefault();
        if (!portfolioFile || !portfolioForm.title || !portfolioForm.category) {
            toast.error('Title, category, and file are required');
            return;
        }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', portfolioFile);
            fd.append('title', portfolioForm.title);
            fd.append('category', portfolioForm.category);
            fd.append('description', portfolioForm.description);
            if (portfolioForm.price !== '') fd.append('price', portfolioForm.price);
            const { data } = await api.post('/portfolio', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPortfolio(prev => [data.item, ...prev]);
            setPortfolioForm({ title: '', category: 'wedding', description: '', price: '' });
            setPortfolioFile(null);
            toast.success('Portfolio item uploaded!');
        } catch {
            toast.error('Failed to upload portfolio item');
        } finally {
            setUploading(false);
        }
    };

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            const { data } = await api.patch('/admin/settings', siteSettings);
            setCtxSettings(prev => ({ ...prev, ...data.settings }));
            toast.success('Settings saved! Changes are live on the website. ✅');
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const changePassword = async () => {
        const { current_password, new_password, confirm_password } = pwForm;
        if (!current_password || !new_password || !confirm_password) {
            toast.error('Saare fields fill karo'); return;
        }
        if (new_password !== confirm_password) {
            toast.error('New passwords match nahi kar rahe!'); return;
        }
        if (new_password.length < 8) {
            toast.error('Password kam se kam 8 characters ka hona chahiye'); return;
        }
        setChangingPw(true);
        try {
            await api.patch('/admin/change-password', pwForm);
            toast.success('Password successfully changed! ✅');
            setPwForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to change password');
        } finally {
            setChangingPw(false);
        }
    };

    const loadAdmins = async () => {
        setLoadingAdmins(true);
        try {
            const { data } = await api.get('/admin/admins');
            setAdminsList(data.admins || []);
        } catch {
            toast.error('Failed to load admin accounts');
        } finally {
            setLoadingAdmins(false);
        }
    };

    const deleteAdmin = async (id, name) => {
        if (!window.confirm(`"${name}" ka account delete karna chahte ho?`)) return;
        try {
            const { data } = await api.delete(`/admin/admins/${id}`);
            toast.success(data.message);
            setAdminsList(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to delete admin');
        }
    };

    const resetAdminPassword = async (id, name) => {
        const np = resetPwMap[id] || '';
        if (!np || np.length < 8) { toast.error('Password min 8 characters'); return; }
        try {
            const { data } = await api.patch(`/admin/admins/${id}/reset-password`, { new_password: np });
            toast.success(data.message);
            setResetPwMap(prev => { const n = { ...prev }; delete n[id]; return n; });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to reset password');
        }
    };

    const saveInviteCode = async () => {
        if (!inviteCode.trim() || inviteCode.trim().length < 4) { toast.error('Min 4 characters'); return; }
        setSavingInviteCode(true);
        try {
            const { data } = await api.patch('/admin/invite-code', { invite_code: inviteCode.trim() });
            toast.success(data.message);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update');
        } finally {
            setSavingInviteCode(false);
        }
    };

    const updatePortfolioPrice = async (itemId) => {
        const priceVal = editPrices[itemId];
        setSavingPrice(itemId);
        try {
            const newPrice = priceVal === '' ? null : Number(priceVal);
            const { data } = await api.patch(`/portfolio/${itemId}`, { price: newPrice });
            setPortfolio(prev => prev.map(p => p.id === itemId ? { ...p, price: data.item.price } : p));
            setEditPrices(prev => { const next = { ...prev }; delete next[itemId]; return next; });
            toast.success(`Price updated to ${newPrice != null ? '₹' + newPrice : 'Price on Request'}`);
        } catch {
            toast.error('Failed to update price');
        } finally {
            setSavingPrice(null);
        }
    };

    const updatePlan = (index, field, value) => {
        setSiteSettings(prev => {
            const plans = [...(prev.pricing_plans || [])];
            plans[index] = { ...plans[index], [field]: field === 'price' ? Number(value) : value };
            return { ...prev, pricing_plans: plans };
        });
    };

    const updatePlanFeature = (planIdx, featIdx, value) => {
        setSiteSettings(prev => {
            const plans = [...(prev.pricing_plans || [])];
            const features = [...(plans[planIdx].features || [])];
            features[featIdx] = value;
            plans[planIdx] = { ...plans[planIdx], features };
            return { ...prev, pricing_plans: plans };
        });
    };

    const addPlanFeature = (planIdx) => {
        setSiteSettings(prev => {
            const plans = [...(prev.pricing_plans || [])];
            plans[planIdx] = { ...plans[planIdx], features: [...(plans[planIdx].features || []), ''] };
            return { ...prev, pricing_plans: plans };
        });
    };

    const removePlanFeature = (planIdx, featIdx) => {
        setSiteSettings(prev => {
            const plans = [...(prev.pricing_plans || [])];
            const features = plans[planIdx].features.filter((_, i) => i !== featIdx);
            plans[planIdx] = { ...plans[planIdx], features };
            return { ...prev, pricing_plans: plans };
        });
    };

    const adminEmail = localStorage.getItem('admin_email') || 'Admin';
    const unreadCount = messages.filter(m => !m.is_read).length;

    return (
        <div className="admin-dash">

            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar__logo">
                    <img src="/logo.png" alt="Classic Studio" style={{ height: 52, width: 'auto', objectFit: 'contain' }} />
                </div>

                <nav className="admin-sidebar__nav">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`admin-nav-item ${tab === t.id ? 'admin-nav-item--active' : ''}`}
                            onClick={() => setTab(t.id)}
                        >
                            <span className="admin-nav-item__icon">{t.icon}</span>
                            {t.label}
                            {t.id === 'messages' && unreadCount > 0 && (
                                <span className="admin-nav-item__badge">{unreadCount}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="admin-sidebar__footer">
                    <p className="admin-sidebar__email" title={adminEmail}>{adminEmail}</p>
                    <button className="admin-sidebar__logout" onClick={handleLogout}>
                        <FiLogOut size={15} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="admin-main">

                {/* Top bar */}
                <header className="admin-topbar">
                    <div>
                        <h1 className="admin-topbar__title">
                            {TABS.find(t => t.id === tab)?.label}
                        </h1>
                        <p className="admin-topbar__subtitle">
                            {tab === 'orders' && `${stats.total || 0} total orders · ₹${stats.total_revenue || 0} revenue`}
                            {tab === 'messages' && `${messages.length} messages · ${unreadCount} unread`}
                            {tab === 'portfolio' && `${portfolio.length} portfolio items`}
                            {tab === 'settings' && 'Brand info, social links & pricing'}
                        </p>
                    </div>
                    <button className="admin-topbar__refresh btn btn-ghost" onClick={loadAll}>
                        <FiRefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </header>

                {loading ? (
                    <div className="admin-loading">
                        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                        <p>Loading data...</p>
                    </div>
                ) : (
                    <>
                        {/* ====== ORDERS TAB ====== */}
                        {tab === 'orders' && (
                            <div className="admin-content">
                                {/* Stats Row */}
                                <div className="admin-stats">
                                    {[
                                        { label: 'Total Orders', value: stats.total || 0, icon: <FiPackage />, color: 'var(--gold)' },
                                        { label: 'Pending', value: stats.pending || 0, icon: <FiClock />, color: '#f59e0b' },
                                        { label: 'In Progress', value: stats.in_progress || 0, icon: <FiRefreshCw />, color: '#3b82f6' },
                                        { label: 'Done', value: stats.done || 0, icon: <FiCheck />, color: '#22c55e' },
                                        { label: 'Revenue', value: `₹${stats.total_revenue || 0}`, icon: <FiDollarSign />, color: 'var(--gold)' },
                                    ].map(s => (
                                        <div key={s.label} className="admin-stat-card card">
                                            <div className="admin-stat-card__icon" style={{ color: s.color, background: `${s.color}15` }}>
                                                {s.icon}
                                            </div>
                                            <div>
                                                <strong className="admin-stat-card__value" style={{ color: s.color }}>{s.value}</strong>
                                                <p className="admin-stat-card__label">{s.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Search & Filter Bar */}
                                {orders.length > 0 && (
                                    <div className="admin-orders-toolbar">
                                        <div className="admin-orders-search">
                                            <FiSearch size={15} className="admin-orders-search__icon" />
                                            <input
                                                type="text"
                                                className="admin-orders-search__input"
                                                placeholder="Search by name, email or mobile..."
                                                value={orderSearch}
                                                onChange={e => { setOrderSearch(e.target.value); setOrderPage(1); }}
                                            />
                                            {orderSearch && (
                                                <button className="admin-orders-search__clear" onClick={() => setOrderSearch('')}>
                                                    <FiX size={13} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="admin-orders-filters">
                                            <FiFilter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                            <select
                                                className="admin-filter-select"
                                                value={orderStatusFilter}
                                                onChange={e => { setOrderStatusFilter(e.target.value); setOrderPage(1); }}
                                            >
                                                <option value="all">All Status</option>
                                                <option value="pending">Pending</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <select
                                                className="admin-filter-select"
                                                value={orderPaymentFilter}
                                                onChange={e => { setOrderPaymentFilter(e.target.value); setOrderPage(1); }}
                                            >
                                                <option value="all">All Payment</option>
                                                <option value="paid">Paid</option>
                                                <option value="unpaid">Unpaid</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Orders Table */}
                                {(() => {
                                    const q = orderSearch.toLowerCase().trim();
                                    const filtered = orders.filter(o => {
                                        const matchSearch = !q || o.name?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q) || o.mobile?.includes(q);
                                        const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                                        const matchPayment = orderPaymentFilter === 'all' || o.payment_status === orderPaymentFilter;
                                        return matchSearch && matchStatus && matchPayment;
                                    });
                                    const totalPages = Math.ceil(filtered.length / ORDERS_PER_PAGE);
                                    const safePage = Math.min(orderPage, Math.max(1, totalPages));
                                    const paginated = filtered.slice((safePage - 1) * ORDERS_PER_PAGE, safePage * ORDERS_PER_PAGE);

                                    if (orders.length === 0) return (
                                        <div className="admin-empty">
                                            <FiPackage size={48} />
                                            <p>No orders yet. Orders will appear here when clients place them.</p>
                                        </div>
                                    );
                                    if (filtered.length === 0) return (
                                        <div className="admin-empty">
                                            <FiSearch size={40} />
                                            <p>Koi order nahi mila. Filter ya search clear karo.</p>
                                        </div>
                                    );
                                    return (
                                        <div>
                                            <div className="admin-table-wrap">
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                                                    {filtered.length} of {orders.length} order{orders.length !== 1 ? 's' : ''} shown
                                                    {totalPages > 1 && ` — Page ${safePage} of ${totalPages}`}
                                                </p>
                                                <table className="admin-table">
                                                    <thead>
                                                        <tr>
                                                            <th>#ID</th>
                                                            <th>Client</th>
                                                            <th>Project Type</th>
                                                            <th>Amount</th>
                                                            <th>Payment</th>
                                                            <th>Status</th>
                                                            <th>Date</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginated.map(order => (
                                                            <tr key={order.id} className="admin-table__row">
                                                                <td className="admin-table__id">#{order.id}</td>
                                                                <td>
                                                                    <div className="admin-table__client">
                                                                        <strong>{order.name}</strong>
                                                                        <span>{order.email}</span>
                                                                        <span>{order.mobile}</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="admin-table__type">{order.project_type}</span>
                                                                    {order.deadline && <span className="admin-table__deadline">📅 {order.deadline}</span>}
                                                                </td>
                                                                <td>
                                                                    <strong style={{ color: 'var(--gold)' }}>
                                                                        {order.amount > 0 ? `₹${order.amount}` : 'Custom'}
                                                                    </strong>
                                                                </td>
                                                                <td>
                                                                    <span style={{ color: PAYMENT_COLORS[order.payment_status]?.color, fontSize: '0.82rem', fontWeight: 600 }}>
                                                                        {PAYMENT_COLORS[order.payment_status]?.label || order.payment_status}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span
                                                                        className="admin-status-badge"
                                                                        style={{
                                                                            background: STATUS_COLORS[order.status]?.bg,
                                                                            color: STATUS_COLORS[order.status]?.color
                                                                        }}
                                                                    >
                                                                        {STATUS_COLORS[order.status]?.label || order.status}
                                                                    </span>
                                                                </td>
                                                                <td className="admin-table__date">
                                                                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </td>
                                                                <td>
                                                                    <div className="admin-table__actions">
                                                                        <select
                                                                            className="admin-status-select"
                                                                            value={order.status}
                                                                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                                                                        >
                                                                            <option value="pending">Pending</option>
                                                                            <option value="in_progress">In Progress</option>
                                                                            <option value="done">Done</option>
                                                                            <option value="cancelled">Cancelled</option>
                                                                        </select>
                                                                        <button
                                                                            className="admin-order-delete"
                                                                            onClick={() => deleteOrder(order.id)}
                                                                            title="Delete order"
                                                                        >
                                                                            <FiTrash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {/* Pagination Controls */}
                                            {totalPages > 1 && (
                                                <div className="admin-pagination">
                                                    <button
                                                        className="admin-pagination__btn"
                                                        onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                                                        disabled={safePage === 1}
                                                    >
                                                        ← Prev
                                                    </button>
                                                    <div className="admin-pagination__pages">
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                                            <button
                                                                key={pg}
                                                                className={`admin-pagination__page ${pg === safePage ? 'admin-pagination__page--active' : ''}`}
                                                                onClick={() => setOrderPage(pg)}
                                                            >
                                                                {pg}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        className="admin-pagination__btn"
                                                        onClick={() => setOrderPage(p => Math.min(totalPages, p + 1))}
                                                        disabled={safePage === totalPages}
                                                    >
                                                        Next →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* ====== MESSAGES TAB ====== */}
                        {tab === 'messages' && (
                            <div className="admin-content">
                                {messages.length === 0 ? (
                                    <div className="admin-empty">
                                        <FiMessageSquare size={48} />
                                        <p>No contact messages yet.</p>
                                    </div>
                                ) : (
                                    <div className="admin-messages">
                                        {messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`admin-message card ${!msg.is_read ? 'admin-message--unread' : ''}`}
                                                onClick={() => !msg.is_read && markMessageRead(msg.id)}
                                            >
                                                <div className="admin-message__header">
                                                    <div className="admin-message__from">
                                                        <div className="admin-message__avatar">
                                                            {msg.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <strong className="admin-message__name">{msg.name}</strong>
                                                            <span className="admin-message__email">{msg.email}</span>
                                                            {msg.mobile && <span className="admin-message__mobile">📱 {msg.mobile}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="admin-message__meta">
                                                        {!msg.is_read && <span className="admin-message__new">New</span>}
                                                        <span className="admin-message__date">
                                                            {new Date(msg.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="admin-message__body">{msg.message}</p>
                                                <div className="admin-message__actions">
                                                    <a
                                                        href={`mailto:${msg.email}?subject=Re: Your enquiry&body=Hi ${msg.name},%0D%0A%0D%0AThank you for reaching out!`}
                                                        className="btn btn-ghost admin-message__reply"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        ✉️ Reply via Email
                                                    </a>
                                                    {msg.mobile && (
                                                        <a
                                                            href={`https://wa.me/91${msg.mobile}?text=Hi ${msg.name}! Thank you for reaching out.`}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="btn btn-ghost admin-message__reply"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            📱 WhatsApp
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ====== PORTFOLIO TAB ====== */}
                        {tab === 'portfolio' && (
                            <div className="admin-content">
                                {/* Upload Form */}
                                <div className="admin-portfolio-upload card">
                                    <h3 className="admin-section-title">Upload New Portfolio Item</h3>
                                    <form onSubmit={uploadPortfolio} className="admin-portfolio-form">
                                        <div className="admin-portfolio-form__grid">
                                            <div className="form-group">
                                                <label className="form-label">Title *</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="e.g. Royal Wedding Highlight"
                                                    value={portfolioForm.title}
                                                    onChange={e => setPortfolioForm(p => ({ ...p, title: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Category *</label>
                                                <select
                                                    className="form-select"
                                                    value={portfolioForm.category}
                                                    onChange={e => setPortfolioForm(p => ({ ...p, category: e.target.value }))}
                                                >
                                                    {PORTFOLIO_CATEGORIES.map(c => (
                                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Price (₹) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— 0 = Price on Request</span></label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    placeholder="e.g. 1499 (leave blank = Price on Request)"
                                                    min={0}
                                                    value={portfolioForm.price}
                                                    onChange={e => setPortfolioForm(p => ({ ...p, price: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Description (optional)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Brief description of the work"
                                                value={portfolioForm.description}
                                                onChange={e => setPortfolioForm(p => ({ ...p, description: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">File (Image or Video) *</label>
                                            <div className="admin-file-pick">
                                                <input
                                                    type="file"
                                                    accept="image/*,video/*"
                                                    onChange={e => setPortfolioFile(e.target.files[0])}
                                                    className="admin-file-input"
                                                    id="portfolio-file"
                                                />
                                                <label htmlFor="portfolio-file" className="btn btn-outline admin-file-label">
                                                    <FiUpload size={15} />
                                                    {portfolioFile ? portfolioFile.name : 'Choose File'}
                                                </label>
                                                {portfolioFile && (
                                                    <button type="button" className="admin-file-clear" onClick={() => setPortfolioFile(null)}>
                                                        <FiX size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                                            {uploading ? <><span className="spinner" /> Uploading...</> : <><FiUpload size={15} /> Upload to Portfolio</>}
                                        </button>
                                    </form>
                                </div>

                                {/* Portfolio items grid */}
                                <h3 className="admin-section-title" style={{ marginTop: 32 }}>
                                    Current Portfolio Items ({portfolio.length})
                                </h3>
                                {portfolio.length === 0 ? (
                                    <div className="admin-empty">
                                        <FiImage size={48} />
                                        <p>No portfolio items yet. Upload your first work above!</p>
                                    </div>
                                ) : (
                                    <div className="admin-portfolio-grid">
                                        {portfolio.map(item => (
                                            <div key={item.id} className="admin-portfolio-item card">
                                                <div className="admin-portfolio-item__preview">
                                                    {item.file_type === 'video' ? (
                                                        <video
                                                            src={item.file_path}
                                                            className="admin-portfolio-item__media"
                                                            muted
                                                            id={`vid-${item.id}`}
                                                            onEnded={() => setPlayingVideos(p => ({ ...p, [item.id]: false }))}
                                                        />
                                                    ) : (
                                                        <img src={item.file_path} alt={item.title} className="admin-portfolio-item__media" />
                                                    )}
                                                    <div className="admin-portfolio-item__overlay">
                                                        {item.file_type === 'video' && (
                                                            <button
                                                                className="admin-portfolio-item__play"
                                                                onClick={() => {
                                                                    const vid = document.getElementById(`vid-${item.id}`);
                                                                    if (!vid) return;
                                                                    if (playingVideos[item.id]) {
                                                                        vid.pause();
                                                                        setPlayingVideos(p => ({ ...p, [item.id]: false }));
                                                                    } else {
                                                                        vid.play();
                                                                        setPlayingVideos(p => ({ ...p, [item.id]: true }));
                                                                    }
                                                                }}
                                                                title={playingVideos[item.id] ? 'Pause' : 'Play video'}
                                                            >
                                                                {playingVideos[item.id] ? '⏸' : <FiPlay size={18} />}
                                                            </button>
                                                        )}
                                                        <button
                                                            className="admin-portfolio-item__delete"
                                                            onClick={() => {
                                                                if (!window.confirm(`"${item.title}" permanently delete karein? File bhi disk se hategi!`)) return;
                                                                deletePortfolioItem(item.id);
                                                            }}
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="admin-portfolio-item__info">
                                                    <strong>{item.title}</strong>
                                                    <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>
                                                        {item.category}
                                                    </span>
                                                    {/* Inline price edit */}
                                                    <div className="admin-price-edit">
                                                        <span className="admin-price-edit__label">₹</span>
                                                        <input
                                                            type="number"
                                                            className="admin-price-edit__input"
                                                            placeholder="Price (0 = on request)"
                                                            min={0}
                                                            value={editPrices[item.id] !== undefined ? editPrices[item.id] : (item.price ?? '')}
                                                            onChange={e => setEditPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                        />
                                                        {editPrices[item.id] !== undefined && (
                                                            <button
                                                                className="admin-price-edit__save"
                                                                onClick={() => updatePortfolioPrice(item.id)}
                                                                disabled={savingPrice === item.id}
                                                                title="Save price"
                                                            >
                                                                {savingPrice === item.id ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <FiCheck size={13} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {/* ====== SETTINGS TAB ====== */}
                        {tab === 'settings' && (
                            <div className="admin-content">

                                {/* Brand Info */}
                                <div className="admin-settings-section card">
                                    <h3 className="admin-section-title">🏷️ Brand Information</h3>
                                    <div className="admin-settings-grid">
                                        <div className="form-group">
                                            <label className="form-label">Brand / Editor Name</label>
                                            <input type="text" className="form-input"
                                                placeholder="e.g. Suresh Edits"
                                                value={siteSettings.editor_name || ''}
                                                onChange={e => setSiteSettings(p => ({ ...p, editor_name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Tagline</label>
                                            <input type="text" className="form-input"
                                                placeholder="e.g. Professional Video & Photo Editing"
                                                value={siteSettings.tagline || ''}
                                                onChange={e => setSiteSettings(p => ({ ...p, tagline: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="admin-settings-section card" style={{ marginTop: 20 }}>
                                    <h3 className="admin-section-title">🔗 Social Links & Contact</h3>
                                    <div className="admin-settings-grid">
                                        <div className="form-group">
                                            <label className="form-label">📱 WhatsApp Number</label>
                                            <input type="text" className="form-input"
                                                placeholder="919876543210 (country code + number, no +)"
                                                value={siteSettings.whatsapp || ''}
                                                onChange={e => setSiteSettings(p => ({ ...p, whatsapp: e.target.value }))}
                                            />
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Example: 919876543210 (India: 91 + 10 digit number)</small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">✉️ Email Address</label>
                                            <input type="email" className="form-input"
                                                placeholder="yourname@gmail.com"
                                                value={siteSettings.email || ''}
                                                onChange={e => setSiteSettings(p => ({ ...p, email: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">📸 Instagram URL</label>
                                            <input type="url" className="form-input"
                                                placeholder="https://instagram.com/yourprofile"
                                                value={siteSettings.instagram || ''}
                                                onChange={e => setSiteSettings(p => ({ ...p, instagram: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">▶️ YouTube Channel URL</label>
                                            <input type="url" className="form-input"
                                                placeholder="https://youtube.com/@yourchannel"
                                                value={siteSettings.youtube || ''}
                                                onChange={e => setSiteSettings(p => ({ ...p, youtube: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Plans */}
                                <div className="admin-settings-section card" style={{ marginTop: 20 }}>
                                    <h3 className="admin-section-title">💎 Pricing Plans</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20, marginTop: -8 }}>
                                        Changes save immediately to the website Pricing page.
                                    </p>
                                    <div className="admin-plans-grid">
                                        {(siteSettings.pricing_plans || []).map((plan, pi) => (
                                            <div key={plan.id || pi} className={`admin-plan-card card ${plan.popular ? 'admin-plan-card--popular' : ''}`}>
                                                {plan.popular && <div className="admin-plan-card__badge">⭐ Most Popular</div>}
                                                <div className="admin-settings-grid" style={{ marginBottom: 16 }}>
                                                    <div className="form-group">
                                                        <label className="form-label">Plan Name</label>
                                                        <input type="text" className="form-input"
                                                            value={plan.name}
                                                            onChange={e => updatePlan(pi, 'name', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Price (₹)</label>
                                                        <input type="number" className="form-input"
                                                            value={plan.price}
                                                            min={0}
                                                            onChange={e => updatePlan(pi, 'price', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Duration</label>
                                                        <input type="text" className="form-input"
                                                            value={plan.duration}
                                                            placeholder="e.g. 24–48 hrs"
                                                            onChange={e => updatePlan(pi, 'duration', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                                                        <label className="form-label">Mark as Popular</label>
                                                        <select className="form-select"
                                                            value={plan.popular ? 'yes' : 'no'}
                                                            onChange={e => updatePlan(pi, 'popular', e.target.value === 'yes')}
                                                        >
                                                            <option value="no">No</option>
                                                            <option value="yes">Yes ⭐</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Features List</label>
                                                {(plan.features || []).map((feat, fi) => (
                                                    <div key={fi} className="admin-feature-row">
                                                        <input type="text" className="form-input"
                                                            value={feat}
                                                            onChange={e => updatePlanFeature(pi, fi, e.target.value)}
                                                            placeholder={`Feature ${fi + 1}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="admin-feature-remove"
                                                            onClick={() => removePlanFeature(pi, fi)}
                                                            title="Remove feature"
                                                        >
                                                            <FiX size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost admin-feature-add"
                                                    onClick={() => addPlanFeature(pi)}
                                                >
                                                    <FiPlus size={14} /> Add Feature
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Email / SMTP Settings */}
                                <div className="admin-settings-section card" style={{ marginTop: 20 }}>
                                    <h3 className="admin-section-title">📧 Email Notifications (SMTP)</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 16, marginTop: -8 }}>
                                        Setup Gmail to get email alerts for new orders.
                                    </p>
                                    <div className="admin-settings-grid">
                                        <div className="form-group">
                                            <label className="form-label">Gmail Address</label>
                                            <input type="email" className="form-input"
                                                placeholder="yourname@gmail.com"
                                                value={siteSettings.smtp_email || ''}
                                                onChange={e => setSiteSettings(p => ({ ...p, smtp_email: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Gmail App Password</label>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    type={showSmtpPass ? 'text' : 'password'}
                                                    className="form-input"
                                                    placeholder="16-char App Password (not Gmail login password)"
                                                    value={siteSettings.smtp_password || ''}
                                                    onChange={e => setSiteSettings(p => ({ ...p, smtp_password: e.target.value }))}
                                                    style={{ paddingRight: 38 }}
                                                />
                                                <button type="button" onClick={() => setShowSmtpPass(!showSmtpPass)}
                                                    style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                    {showSmtpPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                                </button>
                                            </div>
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>
                                                Google Account → Security → 2-Step Verification → App passwords
                                            </small>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Notification Email (Receive alerts at)</label>
                                            <input type="email" className="form-input"
                                                placeholder="yourname@gmail.com (leave blank to use Gmail above)"
                                                value={siteSettings.notify_email || ''}
                                                onChange={e => setSiteSettings(p => ({ ...p, notify_email: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Razorpay Payment Settings */}
                                <div className="admin-settings-section card" style={{ marginTop: 20 }}>
                                    <h3 className="admin-section-title">💳 Payment Gateway (Razorpay)</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 16, marginTop: -8 }}>
                                        Register at <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>razorpay.com</a> → Settings → API Keys → Generate Key.
                                    </p>
                                    <div className="admin-settings-grid">
                                        <div className="form-group">
                                            <label className="form-label">Razorpay Key ID</label>
                                            <input type="text" className="form-input"
                                                placeholder="rzp_live_xxxxxxxxxxxx"
                                                value={siteSettings.razorpay_key_id || ''}
                                                onChange={e => setSiteSettings(p => ({ ...p, razorpay_key_id: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Razorpay Key Secret</label>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    type={showRzpSecret ? 'text' : 'password'}
                                                    className="form-input"
                                                    placeholder="Your Secret Key"
                                                    value={siteSettings.razorpay_key_secret || ''}
                                                    onChange={e => setSiteSettings(p => ({ ...p, razorpay_key_secret: e.target.value }))}
                                                    style={{ paddingRight: 38 }}
                                                />
                                                <button type="button" onClick={() => setShowRzpSecret(!showRzpSecret)}
                                                    style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                    {showRzpSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p style={{ color: siteSettings.razorpay_key_id && !siteSettings.razorpay_key_id.includes('xx') ? '#22c55e' : 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>
                                        {siteSettings.razorpay_key_id && !siteSettings.razorpay_key_id.includes('xx') ? '✅ Payment gateway configured' : '⚠️ Not configured — customers will get "Contact us" message'}
                                    </p>
                                </div>

                                {/* Save Button */}
                                <div className="admin-settings-save">
                                    <button
                                        className="btn btn-primary"
                                        onClick={saveSettings}
                                        disabled={savingSettings}
                                    >
                                        {savingSettings
                                            ? <><span className="spinner" /> Saving...</>
                                            : <><FiSave size={16} /> Save All Settings</>}
                                    </button>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                                        Changes go live on website immediately after saving.
                                    </p>
                                </div>

                                {/* Change Password */}
                                <div className="admin-settings-section card" style={{ marginTop: 20, borderColor: 'rgba(239,68,68,0.2)' }}>
                                    <h3 className="admin-section-title">🔐 Change Admin Password</h3>
                                    <div className="admin-settings-grid">
                                        <div className="form-group">
                                            <label className="form-label">Current Password</label>
                                            <input type="password" className="form-input"
                                                placeholder="••••••••"
                                                value={pwForm.current_password}
                                                onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">New Password</label>
                                            <input type="password" className="form-input"
                                                placeholder="Min 8 characters"
                                                value={pwForm.new_password}
                                                onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Confirm New Password</label>
                                            <input type="password" className="form-input"
                                                placeholder="Dobara type karo"
                                                value={pwForm.confirm_password}
                                                onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-outline"
                                        style={{ marginTop: 12, borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
                                        onClick={changePassword}
                                        disabled={changingPw}
                                    >
                                        {changingPw ? <><span className="spinner" /> Changing...</> : '🔐 Change Password'}
                                    </button>
                                </div>

                                {/* Spacer before invite code section */}
                                <div style={{ height: 20 }} />

                                {/* Invite Code */}
                                <div className="admin-settings-section card" style={{ marginTop: 24, borderColor: 'rgba(212,175,55,0.3)' }}>
                                    <h3 className="admin-section-title">🔑 Registration Invite Code</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 14, marginTop: -8 }}>
                                        Naya admin account banane ke liye yeh code chahiye hota hai.{' '}
                                        {siteSettings.admin_invite_code && (
                                            <>Current code: <code style={{ color: 'var(--gold)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{siteSettings.admin_invite_code}</code></>
                                        )}
                                    </p>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div className="form-group" style={{ flex: 1, minWidth: 200, margin: 0 }}>
                                            <label className="form-label">New Invite Code</label>
                                            <input type="text" className="form-input"
                                                placeholder="Min 4 characters"
                                                value={inviteCode}
                                                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                                style={{ letterSpacing: '0.08em', fontWeight: 600 }}
                                            />
                                        </div>
                                        <button className="btn btn-outline"
                                            style={{ borderColor: 'var(--gold)', color: 'var(--gold)', whiteSpace: 'nowrap' }}
                                            onClick={saveInviteCode} disabled={savingInviteCode}>
                                            {savingInviteCode ? <><span className="spinner" /> Saving...</> : '💾 Update Code'}
                                        </button>
                                    </div>
                                </div>

                                {/* Admin Accounts Management */}
                                <div className="admin-settings-section card" style={{ marginTop: 20, borderColor: 'rgba(99,102,241,0.25)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 className="admin-section-title" style={{ margin: 0 }}>👥 Admin Accounts</h3>
                                        <button className="btn btn-ghost" style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                                            onClick={loadAdmins} disabled={loadingAdmins}>
                                            {loadingAdmins ? <><span className="spinner" /> Loading...</> : <><FiRefreshCw size={14} /> Load Admins</>}
                                        </button>
                                    </div>

                                    {adminsList.length === 0 && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                                            "Load Admins" button dabao sabhi accounts dekhne ke liye
                                        </p>
                                    )}

                                    {adminsList.map(adm => (
                                        <div key={adm.id} style={{
                                            background: 'var(--bg-secondary)', borderRadius: 10,
                                            padding: '14px 16px', marginBottom: 12,
                                            border: '1px solid var(--border-subtle)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                                        {adm.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.83rem' }}>@{adm.username}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                        📧 {adm.email} &nbsp;|&nbsp; 📱 {adm.mobile} &nbsp;|&nbsp; 🏢 {adm.brand_name}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                        Joined: {adm.created_at ? new Date(adm.created_at).toLocaleDateString('en-IN') : '—'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteAdmin(adm.id, adm.name)}
                                                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                    <FiTrash2 size={13} /> Remove
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                                                <input type="password" className="form-input"
                                                    style={{ fontSize: '0.82rem', padding: '7px 12px', flex: 1 }}
                                                    placeholder="New password for this admin (min 8 chars)"
                                                    value={resetPwMap[adm.id] || ''}
                                                    onChange={e => setResetPwMap(prev => ({ ...prev, [adm.id]: e.target.value }))}
                                                />
                                                <button
                                                    onClick={() => resetAdminPassword(adm.id, adm.name)}
                                                    style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold)', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                    🔑 Reset PW
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ height: 32 }} />

                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
