import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiUpload, FiX, FiFile, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
import api from '../api';
import toast from 'react-hot-toast';
import './OrderForm.css';

const PROJECT_TYPES = [
    'Basic Edit (₹499)',
    'Advanced Edit (₹999)',
    'Pro Cinematic (₹1,999)',
    'Wedding Edit',
    'Reels / Shorts',
    'YouTube Video Edit',
    'Photo Retouching',
    'Color Grading',
    'Custom Project',
];

const PRICE_MAP = {
    'Basic Edit (₹499)': 499,
    'Advanced Edit (₹999)': 999,
    'Pro Cinematic (₹1,999)': 1999,
    'Wedding Edit': 999,
    'Reels / Shorts': 499,
    'YouTube Video Edit': 999,
    'Photo Retouching': 499,
    'Color Grading': 999,
    'Custom Project': 0,
};

export default function OrderForm() {
    const { settings } = useSettings();
    const WHATSAPP_NUMBER = settings.whatsapp || '919876543210';
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        mobile: '',
        email: '',
        project_type: params.get('type') || '',
        deadline: '',
        instructions: '',
    });

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadInfo, setUploadInfo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState({});
    const fileRef = useRef();

    // Set amount based on project type
    const amount = PRICE_MAP[form.project_type] || parseInt(params.get('amount') || '0');

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.mobile.match(/^\d{10}$/)) e.mobile = 'Enter valid 10-digit mobile number';
        if (!form.email.includes('@')) e.email = 'Enter valid email address';
        if (!form.project_type) e.project_type = 'Please select a project type';
        return e;
    };

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const handleFileSelect = async (selectedFile) => {
        if (!selectedFile) return;
        const MAX = 500 * 1024 * 1024;
        if (selectedFile.size > MAX) {
            toast.error('File size exceeds 500MB limit');
            return;
        }
        setFile(selectedFile);
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', selectedFile);
            const { data } = await api.post('/api/upload', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    const pct = Math.round((e.loaded * 100) / e.total);
                    // could show progress bar here
                }
            });
            setUploadInfo({ file_path: data.file_path, file_name: data.file_name });
            toast.success('File uploaded successfully!');
        } catch {
            toast.error('File upload failed. You can still submit — share file link in instructions.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) handleFileSelect(f);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fix the errors above');
            return;
        }

        // If payment amount > 0, try Razorpay
        if (amount > 0) {
            await handleRazorpay();
        } else {
            // Custom project — just save order directly
            await saveOrder({});
        }
    };

    const handleRazorpay = async () => {
        try {
            // Check if Razorpay is configured
            const configRes = await api.get('/api/payment/config');
            if (!configRes.data.configured) {
                // Razorpay not configured — save order as unpaid and notify
                toast('Payment gateway not set up yet. Order saved — we will contact you for payment.', { icon: 'ℹ️' });
                await saveOrder({});
                return;
            }
            // Create Razorpay order
            const { data } = await api.post('/api/payment/create-order', {
                amount,
                receipt: `order_${Date.now()}`
            });
            const rzp = new window.Razorpay({
                key: configRes.data.key_id,
                amount: data.order.amount,
                currency: 'INR',
                name: 'Pro Video & Photo Editor',
                description: form.project_type,
                order_id: data.order.id,
                prefill: { name: form.name, email: form.email, contact: form.mobile },
                theme: { color: '#d4af37' },
                handler: async (response) => {
                    await saveOrder({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    });
                },
            });
            rzp.on('payment.failed', () => toast.error('Payment failed. Please try again.'));
            rzp.open();
        } catch (err) {
            toast.error('Payment initialization failed. Please try again or contact us via WhatsApp.');
        }
    };

    const saveOrder = async (paymentData) => {
        setSubmitting(true);
        try {
            await api.post('/api/orders', {
                ...form,
                ...paymentData,
                amount,
                file_path: uploadInfo?.file_path || null,
                file_name: uploadInfo?.file_name || null,
            });
            setSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            toast.error('Failed to place order. Please try WhatsApp or email.');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="order-page page-enter">
                <div className="container order-success">
                    <div className="order-success__icon">✅</div>
                    <h1 className="order-success__title">Order Placed Successfully!</h1>
                    <p className="order-success__desc">
                        Thank you, <strong>{form.name}</strong>! Your order has been received.
                        We will start working on your project and contact you soon.
                    </p>
                    <div className="order-success__actions">
                        <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I just placed an order for ${form.project_type}. Name: ${form.name}`}
                            target="_blank" rel="noopener noreferrer"
                            className="btn btn-primary"
                        >
                            📱 Confirm on WhatsApp
                        </a>
                        <button onClick={() => navigate('/')} className="btn btn-outline">
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="order-page page-enter">
            <div className="order-header">
                <div className="order-header__glow" />
                <div className="container order-header__content">
                    <span className="section-label">Get Started</span>
                    <h1 className="section-title">Place Your <span className="gold-text">Order</span></h1>
                    <div className="gold-divider" />
                    <p className="section-desc">Fill in your project details below. We'll get to work right away!</p>
                </div>
            </div>

            <section className="section order-section">
                <div className="container order-layout">

                    {/* Form */}
                    <form className="order-form card" onSubmit={handleSubmit} noValidate>
                        <h2 className="order-form__title">Project Details</h2>

                        <div className="order-grid">
                            {/* Name */}
                            <div className="form-group">
                                <label className="form-label">Your Name *</label>
                                <input
                                    type="text"
                                    className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                                    placeholder="Enter your full name"
                                    value={form.name}
                                    onChange={handleChange('name')}
                                />
                                {errors.name && <span className="form-error"><FiAlertCircle size={13} /> {errors.name}</span>}
                            </div>

                            {/* Mobile */}
                            <div className="form-group">
                                <label className="form-label">Mobile Number *</label>
                                <input
                                    type="tel"
                                    className={`form-input ${errors.mobile ? 'form-input--error' : ''}`}
                                    placeholder="10-digit mobile number"
                                    value={form.mobile}
                                    onChange={handleChange('mobile')}
                                    maxLength={10}
                                />
                                {errors.mobile && <span className="form-error"><FiAlertCircle size={13} /> {errors.mobile}</span>}
                            </div>

                            {/* Email */}
                            <div className="form-group">
                                <label className="form-label">Email Address *</label>
                                <input
                                    type="email"
                                    className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                                    placeholder="yourname@email.com"
                                    value={form.email}
                                    onChange={handleChange('email')}
                                />
                                {errors.email && <span className="form-error"><FiAlertCircle size={13} /> {errors.email}</span>}
                            </div>

                            {/* Project Type */}
                            <div className="form-group">
                                <label className="form-label">Project Type *</label>
                                <select
                                    className={`form-select ${errors.project_type ? 'form-input--error' : ''}`}
                                    value={form.project_type}
                                    onChange={handleChange('project_type')}
                                >
                                    <option value="">— Select project type —</option>
                                    {PROJECT_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                {errors.project_type && <span className="form-error"><FiAlertCircle size={13} /> {errors.project_type}</span>}
                            </div>

                            {/* Deadline */}
                            <div className="form-group">
                                <label className="form-label">Deadline</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={form.deadline}
                                    onChange={handleChange('deadline')}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="form-group" style={{ marginTop: 8 }}>
                            <label className="form-label">Special Instructions</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Describe your vision, preferred style, music links, references, or any specific requirements..."
                                value={form.instructions}
                                onChange={handleChange('instructions')}
                                rows={4}
                            />
                        </div>

                        {/* File Upload */}
                        <div className="form-group" style={{ marginTop: 8 }}>
                            <label className="form-label">Upload Your Files (Optional)</label>
                            <div
                                className={`file-drop ${file ? 'file-drop--has-file' : ''}`}
                                onClick={() => fileRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    style={{ display: 'none' }}
                                    accept="image/*,video/*,.zip,.rar"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                                {file ? (
                                    <div className="file-drop__selected">
                                        <FiFile size={22} className="file-drop__file-icon" />
                                        <div>
                                            <p className="file-drop__filename">{file.name}</p>
                                            <p className="file-drop__filesize">
                                                {(file.size / (1024 * 1024)).toFixed(1)} MB
                                                {uploading && ' — Uploading...'}
                                                {!uploading && uploadInfo && ' — ✅ Uploaded'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="file-drop__remove"
                                            onClick={(e) => { e.stopPropagation(); setFile(null); setUploadInfo(null); }}
                                        >
                                            <FiX size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="file-drop__placeholder">
                                        <FiUpload size={28} className="file-drop__icon" />
                                        <p>Drag & drop or <span className="file-drop__browse">click to browse</span></p>
                                        <p className="file-drop__note">Images, Videos, ZIP files — max 500MB</p>
                                    </div>
                                )}
                            </div>
                            <p className="form-hint">💡 For files larger than 500MB, paste your Google Drive / WeTransfer link in the instructions field.</p>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary order-submit-btn"
                            disabled={submitting || uploading}
                        >
                            {submitting ? (
                                <><span className="spinner" /> Placing Order...</>
                            ) : amount > 0 ? (
                                <>💳 Pay ₹{amount.toLocaleString('en-IN')} & Order</>
                            ) : (
                                <>📋 Place Order</>
                            )}
                        </button>
                    </form>

                    {/* Order Summary Sidebar */}
                    <div className="order-sidebar">
                        <div className="order-summary card">
                            <h3 className="order-summary__title">Order Summary</h3>
                            <div className="order-summary__row">
                                <span>Project Type</span>
                                <span>{form.project_type || '—'}</span>
                            </div>
                            <div className="order-summary__row">
                                <span>Deadline</span>
                                <span>{form.deadline || 'Not specified'}</span>
                            </div>
                            <div className="order-summary__divider" />
                            <div className="order-summary__total">
                                <span>Total Amount</span>
                                <strong className="gold-text">
                                    {amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : 'Custom Quote'}
                                </strong>
                            </div>
                        </div>

                        <div className="order-help card-glass" style={{ padding: '20px', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                                Need help placing your order?
                            </p>
                            <a
                                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                                target="_blank" rel="noopener noreferrer"
                                className="btn btn-ghost"
                                style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem' }}
                            >
                                📱 WhatsApp Us
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
