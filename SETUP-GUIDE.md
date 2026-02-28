# Professional Video & Photo Editor — Configuration Guide

## Step 1: Backend .env — Apna Data Dalo

Edit `backend/.env` file:

```env
# ============================================
# SERVER
# ============================================
PORT=5000
FRONTEND_URL=http://localhost:5173   # Production mein: Vercel URL daalo

# ============================================
# ADMIN LOGIN (WEBSITE PE SIRF TUM USE KARO)
# ============================================
ADMIN_EMAIL=tumhara_email@gmail.com    # Admin login email
ADMIN_PASSWORD=TumharaStrongPassword@123  # Strong password rakho!

# ============================================
# JWT (SECURITY - ZAROOR CHANGE KARO!)
# ============================================
JWT_SECRET=koi_bhi_random_string_likho_yahan_32_chars

# ============================================
# RAZORPAY PAYMENT GATEWAY
# ============================================
# Account banao: https://razorpay.com
# Test keys milenge dashboard > Settings > API Keys
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX

# ============================================
# EMAIL NOTIFICATIONS (Gmail)
# ============================================
# Gmail App Password kaise banate hain:
# 1. Gmail → Settings → Security
# 2. 2-Factor Authentication ON karo
# 3. "App Passwords" search karo
# 4. Select app: Mail | Select device: Other
# 5. Jo password mile woh SMTP_PASSWORD mein daalo
SMTP_EMAIL=tumhari_gmail@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx   # 16-char App Password (spaces ke saath)
NOTIFY_EMAIL=tumhari_gmail@gmail.com  # Naye orders yahan aayenge

# ============================================
# SOCIAL / BRAND (WEBSITE PE DIKHTA HAI)
# ============================================
WHATSAPP_NUMBER=919876543210   # Country code + number (no + or -)
INSTAGRAM_URL=https://instagram.com/tumhara_username
EDITOR_NAME=Tumhara Brand Name
```

## Step 2: Frontend .env — Same Data Frontend Ke Liye

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_WHATSAPP_NUMBER=919876543210
VITE_INSTAGRAM_URL=https://instagram.com/tumhara_username
VITE_EDITOR_EMAIL=tumhari_gmail@gmail.com
VITE_EDITOR_NAME=Tumhara Brand Name
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
```

## Step 3: Admin Password Change Karo

`backend/.env` mein `ADMIN_PASSWORD` change karne ke baad:
```bash
# Backend restart karo (naya password auto-hash hoga first start pe)
node seed-admin.js   # agar available ho ya
npm start            # Seedhi restart
```

> ⚠️ **JWT_SECRET zaroor change karo** production mein! Koi bhi random string 32+ chars.

## Step 4: Deployment (Optional)

### Frontend → Vercel (Free)
1. [vercel.com](https://vercel.com) → GitHub se connect karo
2. Import repo → Root folder: `frontend`
3. Environment variables add karo (Vercel dashboard → Settings → Environment Variables)
4. Deploy!

### Backend → Render (Free)
1. [render.com](https://render.com) → New Web Service
2. Connect repo → Root dir: `backend`
3. Build: `npm install` | Start: `npm start`
4. Environment variables add karo (Render dashboard → Environment)
5. Note the URL (e.g. `https://proeditor-xyz.onrender.com`)
6. **FRONTEND_URL ko Vercel URL se update karo**

### Production ke baad update karo:
- `frontend/vercel.json` → `/api/*` route mein apna Render URL daalo
- `backend/.env` → `FRONTEND_URL` mein apna Vercel URL daalo
