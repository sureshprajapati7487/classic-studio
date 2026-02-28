const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const adapter = new FileSync(path.join(__dirname, 'editor.db.json'));
const db = low(adapter);

function initializeDB() {
  // Set defaults if not already set
  db.defaults({
    orders: [],
    admins: [],
    portfolio_items: [],
    contact_messages: [],
    _sequences: { orders: 0, admins: 0, portfolio_items: 0, contact_messages: 0 },
    site_settings: {
      // Brand
      editor_name: 'Pro Editor',
      tagline: 'Professional Video & Photo Editing Services',
      // Social Links
      whatsapp: '919876543210',
      instagram: 'https://instagram.com/yourprofile',
      youtube: '',
      email: 'youremail@gmail.com',
      // Email (SMTP) Settings
      smtp_email: '',
      smtp_password: '',
      notify_email: '',
      // Payment (Razorpay) Settings
      razorpay_key_id: '',
      razorpay_key_secret: '',
      // Pricing Plans
      pricing_plans: [
        {
          id: 'basic',
          name: 'Basic Edit',
          price: 499,
          duration: '24–48 hrs',
          popular: false,
          features: [
            'Basic cuts & transitions',
            'Background music sync',
            'Color correction',
            'Up to 5 min video',
            '2 revisions',
          ],
        },
        {
          id: 'advanced',
          name: 'Advanced Edit',
          price: 999,
          duration: '2–3 days',
          popular: true,
          features: [
            'Advanced cuts & effects',
            'Motion graphics & titles',
            'Color grading (LUT)',
            'Sound design',
            'Up to 15 min video',
            '4 revisions',
          ],
        },
        {
          id: 'pro',
          name: 'Pro / Cinematic',
          price: 1999,
          duration: '3–5 days',
          popular: false,
          features: [
            'Full cinematic grade',
            'Custom 2D/3D motion graphics',
            'Advanced VFX compositing',
            'Multi-camera edit',
            'No time limit',
            'Unlimited revisions',
          ],
        },
      ],
    },
  }).write();


  // Seed default admin if not exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@editor.com';
  const existingAdmin = db.get('admins').find({ email: adminEmail }).value();

  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync(
      process.env.ADMIN_PASSWORD || 'Admin@1234',
      10
    );
    const id = (db.get('_sequences.admins').value() || 0) + 1;
    db.get('admins').push({
      id,
      email: adminEmail,
      password: hashedPassword,
      created_at: new Date().toISOString()
    }).write();
    db.set('_sequences.admins', id).write();
    console.log('✅ Default admin account created');
  }

  console.log('✅ Database (JSON) initialized successfully');
}

// Helper functions mimicking SQLite API
function nextId(table) {
  const current = db.get(`_sequences.${table}`).value() || 0;
  const next = current + 1;
  db.set(`_sequences.${table}`, next).write();
  return next;
}

module.exports = { db, initializeDB, nextId };
