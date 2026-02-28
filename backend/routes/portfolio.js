const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, nextId } = require('../db');
const { verifyToken } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'portfolio');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024 * 1024 } }); // 4GB — supports 4K videos

// GET /api/portfolio — All active portfolio items (optionally by category)
router.get('/', (req, res) => {
    try {
        const { category } = req.query;
        let items = db.get('portfolio_items').filter({ is_active: true });
        if (category) items = items.filter({ category });
        const result = items.orderBy(['sort_order', 'created_at'], ['asc', 'desc']).value();
        res.json({ success: true, items: result });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

// POST /api/portfolio — Admin: Upload portfolio item
router.post('/', verifyToken, upload.single('file'), (req, res) => {
    try {
        const { title, category, description, sort_order, price } = req.body;
        if (!title || !category || !req.file) {
            return res.status(400).json({ error: 'Title, category, and file are required' });
        }

        const file_type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
        const file_path = `/uploads/portfolio/${req.file.filename}`;
        const id = nextId('portfolio_items');

        // Detect if likely 4K based on file size (>500MB raw video = likely 4K)
        const file_size = req.file.size;

        const item = {
            id, title, category, file_path, file_type,
            description: description || '',
            price: price !== undefined && price !== '' ? Number(price) : null,
            sort_order: parseInt(sort_order) || 0,
            is_active: true,
            file_size,
            original_name: req.file.originalname,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        db.get('portfolio_items').push(item).write();
        res.status(201).json({ success: true, item });
    } catch (err) {
        res.status(500).json({ error: 'Failed to upload portfolio item' });
    }
});

// PATCH /api/portfolio/:id — Admin: Update price or other fields
router.patch('/:id', verifyToken, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const item = db.get('portfolio_items').find({ id }).value();
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const allowed = ['title', 'description', 'price', 'sort_order', 'category', 'is_active'];
        const updates = { updated_at: new Date().toISOString() };
        allowed.forEach(key => {
            if (req.body[key] !== undefined) {
                updates[key] = key === 'price' ? (req.body[key] === '' ? null : Number(req.body[key]))
                    : key === 'sort_order' ? parseInt(req.body[key])
                        : req.body[key];
            }
        });

        db.get('portfolio_items').find({ id }).assign(updates).write();
        const updated = db.get('portfolio_items').find({ id }).value();
        res.json({ success: true, item: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update portfolio item' });
    }
});

// DELETE /api/portfolio/:id — Admin: Remove portfolio item
router.delete('/:id', verifyToken, (req, res) => {
    try {
        const item = db.get('portfolio_items').find({ id: parseInt(req.params.id) }).value();
        if (!item) return res.status(404).json({ error: 'Item not found' });
        db.get('portfolio_items').remove({ id: parseInt(req.params.id) }).write();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

module.exports = router;

