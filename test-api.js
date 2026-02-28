/**
 * Phase 7: Full API Test Suite
 * Tests all endpoints against the running backend on port 5000
 */
const http = require('http');

let passed = 0;
let failed = 0;
let adminToken = '';

function req(method, path, body, token) {
    return new Promise((resolve) => {
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: 'localhost',
            port: 5000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
            },
        };
        const r = http.request(opts, (res) => {
            let d = '';
            res.on('data', (c) => (d += c));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(d) });
                } catch {
                    resolve({ status: res.statusCode, body: d });
                }
            });
        });
        r.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
        r.setTimeout(5000, () => { r.destroy(); resolve({ status: 0, body: { error: 'Timeout' } }); });
        if (data) r.write(data);
        r.end();
    });
}

function pass(name, detail) {
    passed++;
    console.log(`  ✅ PASS  ${name}${detail ? ' — ' + detail : ''}`);
}

function fail(name, detail) {
    failed++;
    console.error(`  ❌ FAIL  ${name}${detail ? ' — ' + detail : ''}`);
}

async function runTests() {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║   Phase 7: API Verification Test Suite           ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    // ── HEALTH CHECK ────────────────────────────────────────────
    console.log('📋 GROUP 1: Health & Core');
    let h = await req('GET', '/api/health');
    h.status === 200 && h.body.status === 'ok'
        ? pass('GET /api/health', h.body.message)
        : fail('GET /api/health', JSON.stringify(h.body));

    // ── ORDERS ────────────────────────────────────────────────────
    console.log('\n📋 GROUP 2: Orders');
    let o = await req('POST', '/api/orders', {
        name: 'Rahul Test', mobile: '9876543210',
        email: 'rahul@test.com', project_type: 'Wedding Edit', amount: 999
    });
    const orderId = o.body.order?.id;
    o.status === 201 && orderId
        ? pass('POST /api/orders', `Order ID #${orderId}, status=${o.body.order.status}`)
        : fail('POST /api/orders', JSON.stringify(o.body));

    let o2 = await req('POST', '/api/orders', {
        name: '', mobile: '9876543210', email: 'test@t.com', project_type: ''
    });
    o2.status === 400
        ? pass('POST /api/orders validation', `400 returned for missing fields`)
        : fail('POST /api/orders validation', `Expected 400, got ${o2.status}`);

    // ── CONTACT ───────────────────────────────────────────────────
    console.log('\n📋 GROUP 3: Contact');
    let c = await req('POST', '/api/contact', {
        name: 'Priya Test', email: 'priya@test.com',
        mobile: '9876543211', message: 'I need a reel edited'
    });
    c.status === 200 && c.body.success
        ? pass('POST /api/contact', c.body.message)
        : fail('POST /api/contact', JSON.stringify(c.body));

    // ── PAYMENT CONFIG ────────────────────────────────────────────
    console.log('\n📋 GROUP 4: Payment');
    let p = await req('GET', '/api/payment/config');
    p.status === 200 && typeof p.body.configured === 'boolean'
        ? pass('GET /api/payment/config', `configured=${p.body.configured}, key=${p.body.key_id || 'NOT SET (placeholder)'}`)
        : fail('GET /api/payment/config', JSON.stringify(p.body));

    // ── ADMIN AUTH ────────────────────────────────────────────────
    console.log('\n📋 GROUP 5: Admin Auth');
    let la = await req('POST', '/api/admin/login', {
        email: 'wrong@test.com', password: 'wrongpass'
    });
    la.status === 401
        ? pass('POST /api/admin/login (wrong creds)', `401 returned correctly`)
        : fail('POST /api/admin/login (wrong creds)', `Expected 401, got ${la.status}`);

    let l = await req('POST', '/api/admin/login', {
        email: 'admin@editor.com', password: 'Admin@1234'
    });
    if (l.status === 200 && l.body.token) {
        adminToken = l.body.token;
        pass('POST /api/admin/login (correct)', `Token received, admin=${l.body.admin.email}`);
    } else {
        fail('POST /api/admin/login (correct)', JSON.stringify(l.body));
    }

    // ── ADMIN VERIFY ───────────────────────────────────────────────
    let v = await req('GET', '/api/admin/verify', null, adminToken);
    v.status === 200 && v.body.success
        ? pass('GET /api/admin/verify', `Authenticated as ${v.body.admin?.email}`)
        : fail('GET /api/admin/verify', JSON.stringify(v.body));

    // Unauthorized (no token)
    let unauth = await req('GET', '/api/admin/orders');
    unauth.status === 401 || unauth.status === 403
        ? pass('GET /api/admin/orders (no token)', `${unauth.status} returned — route protected correctly`)
        : fail('GET /api/admin/orders (no token)', `Expected 401/403, got ${unauth.status}`);

    // ── ADMIN ORDERS ───────────────────────────────────────────────
    console.log('\n📋 GROUP 6: Admin Orders');
    let ao = await req('GET', '/api/admin/orders', null, adminToken);
    ao.status === 200 && Array.isArray(ao.body.orders)
        ? pass('GET /api/admin/orders', `total=${ao.body.stats?.total}, pending=${ao.body.stats?.pending}, revenue=₹${ao.body.stats?.total_revenue}`)
        : fail('GET /api/admin/orders', JSON.stringify(ao.body));

    if (orderId) {
        let su = await req('PATCH', `/api/orders/${orderId}/status`, { status: 'in_progress' }, adminToken);
        su.status === 200 && su.body.order?.status === 'in_progress'
            ? pass('PATCH /api/orders/:id/status', `Order #${orderId} → in_progress`)
            : fail('PATCH /api/orders/:id/status', JSON.stringify(su.body));
    }

    // ── ADMIN MESSAGES ─────────────────────────────────────────────
    console.log('\n📋 GROUP 7: Admin Messages');
    let am = await req('GET', '/api/admin/messages', null, adminToken);
    am.status === 200 && Array.isArray(am.body.messages)
        ? pass('GET /api/admin/messages', `total=${am.body.messages.length} messages`)
        : fail('GET /api/admin/messages', JSON.stringify(am.body));

    // ── PORTFOLIO ─────────────────────────────────────────────────
    console.log('\n📋 GROUP 8: Portfolio');
    let pf = await req('GET', '/api/portfolio');
    pf.status === 200 && Array.isArray(pf.body.items)
        ? pass('GET /api/portfolio', `total=${pf.body.items.length} items`)
        : fail('GET /api/portfolio', JSON.stringify(pf.body));

    // ── SUMMARY ───────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log(`║  RESULTS: ${passed} passed, ${failed} failed                      ║`);
    console.log('╚══════════════════════════════════════════════════╝\n');
    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED! Backend is fully functional.\n');
    } else {
        console.log(`⚠️  ${failed} test(s) failed. Review output above.\n`);
    }
}

runTests().catch(console.error);
