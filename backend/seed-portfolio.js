/**
 * seed-portfolio.js
 * Run this once to seed 6 placeholder portfolio items into the database.
 * Usage: node seed-portfolio.js
 */
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('editor.db.json');
const db = low(adapter);

const items = [
    { category: 'wedding', title: 'Royal Wedding Highlight', description: 'Cinematic golden hour wedding edit', file_path: '/uploads/portfolio-wedding.jpg', file_type: 'image' },
    { category: 'reels', title: 'Urban Travel Reel', description: 'Viral-style neon city reels edit', file_path: '/uploads/portfolio-reels.jpg', file_type: 'image' },
    { category: 'youtube', title: 'YouTube Studio Edit', description: 'Professional YouTube video edit', file_path: '/uploads/portfolio-youtube.jpg', file_type: 'image' },
    { category: 'photo', title: 'Beauty Portrait Retouch', description: 'Luxury portrait retouching with gold tones', file_path: '/uploads/portfolio-photo.jpg', file_type: 'image' },
    { category: 'color', title: 'Orange & Teal Color Grade', description: 'Before/After cinematic LUT color grade', file_path: '/uploads/portfolio-color.jpg', file_type: 'image' },
    { category: 'cinematic', title: 'Rainy Night Short Film', description: 'Cinematic short film — rain, neon, mood', file_path: '/uploads/portfolio-cinematic.jpg', file_type: 'image' },
];

const existing = db.get('portfolio_items').value();
if (existing.length > 0) {
    console.log(`ℹ️  Portfolio already has ${existing.length} items. Skipping seed.`);
    console.log('   To re-seed, delete portfolio_items from editor.db.json first.\n');
    process.exit(0);
}

const now = new Date().toISOString();
let id = 1;
items.forEach(item => {
    db.get('portfolio_items').push({
        id: id++,
        ...item,
        created_at: now,
        updated_at: now,
    }).write();
});

console.log(`✅ Seeded ${items.length} portfolio items successfully!\n`);
console.log('Items seeded:');
items.forEach(i => console.log(`  • [${i.category}] ${i.title}`));
console.log('\nRestart your backend and visit http://localhost:5173/portfolio to see them.\n');
