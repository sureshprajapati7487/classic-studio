const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db } = require('../db');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

// Get Razorpay instance dynamically — reads from DB settings first, then .env fallback
function getRazorpay() {
    const s = db.get('site_settings').value() || {};
    const keyId = s.razorpay_key_id || process.env.RAZORPAY_KEY_ID || '';
    const keySecret = s.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET || '';
    if (!keyId || keyId.includes('xxxxxxxxxxxx') || !keySecret) return null;
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// GET /api/payment/config — Send config status to frontend
router.get('/config', (req, res) => {
    const s = db.get('site_settings').value() || {};
    const keyId = s.razorpay_key_id || process.env.RAZORPAY_KEY_ID || null;
    const configured = !!(keyId && !keyId.includes('xxxxxxxxxxxx'));
    res.json({ key_id: keyId, configured });
});

// POST /api/payment/create-order — Create Razorpay order
router.post('/create-order', async (req, res) => {
    try {
        const rzp = getRazorpay();
        if (!rzp) {
            return res.status(503).json({ error: 'Payment gateway not configured. Please add Razorpay API keys in Admin → Settings.' });
        }
        const { amount, currency = 'INR', receipt } = req.body;
        if (!amount) return res.status(400).json({ error: 'Amount is required' });

        const order = await rzp.orders.create({
            amount: amount * 100,
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1
        });
        res.json({ success: true, order });
    } catch (err) {
        console.error('Razorpay order creation error:', err);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// POST /api/payment/verify — Verify payment signature
router.post('/verify', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment verification fields' });
        }

        const s = db.get('site_settings').value() || {};
        const keySecret = s.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET || '';

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, error: 'Invalid payment signature' });
        }

        // Update order payment status in DB
        if (order_id) {
            db.get('orders').find({ id: parseInt(order_id) })
                .assign({ payment_status: 'paid', razorpay_payment_id, updated_at: new Date().toISOString() })
                .write();
        }

        res.json({ success: true, message: 'Payment verified successfully' });
    } catch (err) {
        console.error('Payment verification error:', err);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

module.exports = router;
