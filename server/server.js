import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { generateCheckMacValue, generateHtmlForm } from './ecpay_utils.js';
import { createDb } from './db.js';
import { calculateOpenFateBazi } from './bazi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

for (const file of ['.env.local', '.env.development', '.env']) {
    const envPath = [path.join(rootDir, file), path.join(__dirname, file)].find((candidate) => fs.existsSync(candidate));
    if (envPath) {
        dotenv.config({ path: envPath });
        console.log(`Loaded environment from ${envPath}`);
        break;
    }
}

const configTsPath = path.join(rootDir, 'src', 'config.ts');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && fs.existsSync(configTsPath)) {
    const content = fs.readFileSync(configTsPath, 'utf-8');
    const urlMatch = content.match(/SUPABASE_URL\s*=\s*(['"`])(.*?)\1/);
    const keyMatch = content.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(['"`])(.*?)\1/);
    if (!process.env.SUPABASE_URL && urlMatch) process.env.SUPABASE_URL = urlMatch[2];
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && keyMatch) process.env.SUPABASE_SERVICE_ROLE_KEY = keyMatch[2];
}

const app = express();
const port = Number(process.env.PORT || 3001);
const db = await createDb();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

const ECPAY_CONFIG = {
    MerchantID: process.env.ECPAY_MERCHANT_ID || '2000132',
    HashKey: process.env.ECPAY_HASH_KEY || '5294y06JbISpM5x9',
    HashIV: process.env.ECPAY_HASH_IV || 'v77hoKGq4kWxNNIS',
    ActionUrl: process.env.ECPAY_ACTION_URL || 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
};

const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
const frontendBaseUrl = process.env.FRONTEND_BASE_URL || publicBaseUrl;

const requireDb = (res) => {
    if (db.ready) return true;
    res.status(500).json({ error: 'Database not initialized. Check .env.local database settings.' });
    return false;
};

app.get('/api/health', (_req, res) => {
    res.json({ ok: true, provider: db.provider, ready: db.ready });
});

app.post('/api/bazi/chart', (req, res) => {
    try {
        res.json(calculateOpenFateBazi(req.body || {}));
    } catch (error) {
        res.status(error.status || 500).json({ error: 'Bazi calculation failed', details: error.message || error });
    }
});

const stripHtml = (html = '') => html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const pickAlmanacField = (text, label) => {
    const pattern = new RegExp(`【${label}】([^【]+)`);
    return text.match(pattern)?.[1]?.trim() || '';
};

const splitTerms = (value = '') => value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

app.get('/api/almanac', async (req, res) => {
    const now = new Date();
    const year = Number(req.query.year || now.getFullYear());
    const month = Number(req.query.month || now.getMonth() + 1);
    const day = Number(req.query.day || now.getDate());

    if (!year || !month || !day) {
        return res.status(400).json({ error: 'year, month and day are required.' });
    }

    try {
        const body = new URLSearchParams({
            FUNC: 'Basic',
            Day: String(day),
            Target: String(day),
            SubTarget: '-1',
            Old: '0',
            Year: String(year),
            Month: String(month),
        });
        const response = await fetch('https://fate.windada.com/cgi-bin/calendar', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body,
        });
        if (!response.ok) throw new Error(`Windada responded ${response.status}`);

        const html = await response.text();
        const match = html.match(new RegExp(`DayInfoA\\[${day}\\]='([\\s\\S]*?)';`));
        if (!match) throw new Error('Windada day data not found');

        const text = stripHtml(match[1]);
        const positions = pickAlmanacField(text, '方位');
        res.json({
            source: 'Windada',
            raw: text,
            solarDate: pickAlmanacField(text, '陽曆'),
            lunarDate: pickAlmanacField(text, '農曆'),
            chongSha: pickAlmanacField(text, '沖') || text.match(/【沖([^】]+)】/)?.[1]?.trim() || '',
            suiSha: text.match(/【歲煞︰([^】]+)】/)?.[1]?.trim() || '',
            ganZhi: pickAlmanacField(text, '干支'),
            taiShen: pickAlmanacField(text, '胎神'),
            ninePalace: pickAlmanacField(text, '九宮'),
            luckyHours: pickAlmanacField(text, '吉時'),
            positions,
            xi: positions.match(/喜神(\S+)/)?.[1] || '',
            cai: positions.match(/財神(\S+)/)?.[1] || '',
            fu: positions.match(/福神(\S+)/)?.[1] || '',
            zhouTang: pickAlmanacField(text, '週堂'),
            pengZu: pickAlmanacField(text, '彭祖百忌'),
            twelveOfficer: pickAlmanacField(text, '12建星'),
            twentyEightMansion: pickAlmanacField(text, '28星宿'),
            jinFu: pickAlmanacField(text, '金符'),
            auspiciousGods: splitTerms(pickAlmanacField(text, '吉神')),
            inauspiciousGods: splitTerms(pickAlmanacField(text, '凶神')),
            yi: splitTerms(pickAlmanacField(text, '宜')),
            ji: splitTerms(pickAlmanacField(text, '忌')),
        });
    } catch (error) {
        console.error('Windada Almanac Error:', error);
        res.status(502).json({ error: 'Failed to fetch Windada almanac', details: error.message || error });
    }
});

app.post('/api/auth/register', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.registerUser !== 'function') {
        return res.status(400).json({ error: 'Local member registration is only available for local database adapters.' });
    }

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required.' });
    if (String(password).length < 6) return res.status(400).json({ error: '密碼長度需至少 6 碼' });

    try {
        const user = await db.registerUser(email, password);
        res.json({ success: true, user });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.verifyUser !== 'function') {
        return res.status(400).json({ error: 'Local member login is only available for local database adapters.' });
    }

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required.' });

    try {
        const user = await db.verifyUser(email, password);
        if (!user) return res.status(401).json({ error: '帳號或密碼錯誤' });
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message || error });
    }
});

app.get('/api/profiles', async (_req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.listProfiles !== 'function') {
        return res.status(400).json({ error: 'Local profile listing is only available for local database adapters.' });
    }

    try {
        res.json(await db.listProfiles());
    } catch (error) {
        res.status(500).json({ error: 'Profile listing failed', details: error.message || error });
    }
});

app.get('/api/profiles/:id', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.getProfile !== 'function') {
        return res.status(400).json({ error: 'Local profiles are only available for local database adapters.' });
    }

    const profile = await db.getProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
});

app.delete('/api/profiles/:id', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.deleteProfileCascade !== 'function') {
        return res.status(400).json({ error: 'Local profile deletion is only available for local database adapters.' });
    }

    try {
        res.json({ success: true, ...(await db.deleteProfileCascade(req.params.id)) });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Profile deletion failed' });
    }
});

app.get('/api/purchases', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.listPurchases !== 'function') {
        return res.status(400).json({ error: 'Local purchase listing is only available for local database adapters.' });
    }

    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).json({ error: 'userId is required.' });

    try {
        res.json(await db.listPurchases(userId));
    } catch (error) {
        res.status(500).json({ error: 'Purchase listing failed', details: error.message || error });
    }
});

app.put('/api/profiles/:id', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.updateProfile !== 'function') {
        return res.status(400).json({ error: 'Local profile updates are only available for local database adapters.' });
    }

    try {
        const profile = await db.updateProfile(req.params.id, req.body || {});
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Profile update failed', details: error.message || error });
    }
});

app.post('/api/admin/login', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.verifyAdmin !== 'function') {
        return res.status(400).json({ error: 'Local admin login is only available for local database adapters.' });
    }

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required.' });

    try {
        const admin = await db.verifyAdmin(email, password);
        if (!admin) return res.status(401).json({ error: 'Invalid admin credentials.' });
        res.json({ success: true, user: admin });
    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ error: 'Admin login failed', details: error.message || error });
    }
});

app.post('/api/create-order', async (req, res) => {
    if (!requireDb(res)) return;

    const { userId, productId, amount, itemNames } = req.body;
    if (!userId || !productId || amount === undefined) {
        return res.status(400).json({ error: 'userId, productId and amount are required.' });
    }

    try {
        const merchantTradeNo = `GX${Date.now()}`;
        const order = await db.createOrder({
            user_id: userId,
            product_id: productId,
            amount,
            status: 'PENDING',
            merchant_trade_no: merchantTradeNo,
        });

        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const merchantTradeDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const baseParams = {
            MerchantID: ECPAY_CONFIG.MerchantID,
            MerchantTradeNo: merchantTradeNo,
            MerchantTradeDate: merchantTradeDate,
            PaymentType: 'aio',
            TotalAmount: String(amount),
            TradeDesc: 'Guangxing digital product purchase',
            ItemName: itemNames || 'Digital Product',
            ReturnURL: `${publicBaseUrl}/api/webhook/ecpay`,
            ClientBackURL: `${frontendBaseUrl}/profile`,
            ChoosePayment: 'ALL',
            EncryptType: '1',
        };

        const checkMacValue = generateCheckMacValue(baseParams, ECPAY_CONFIG.HashKey, ECPAY_CONFIG.HashIV);
        res.send(generateHtmlForm(ECPAY_CONFIG.ActionUrl, { ...baseParams, CheckMacValue: checkMacValue, CustomField1: order.id }));
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ error: 'Failed to create order', details: error.message || error });
    }
});

app.post('/api/webhook/ecpay', async (req, res) => {
    if (!db.ready) return res.status(500).send('0|DatabaseNotReady');

    try {
        const receivedCheckMacValue = req.body.CheckMacValue;
        const calculatedCheckMacValue = generateCheckMacValue(req.body, ECPAY_CONFIG.HashKey, ECPAY_CONFIG.HashIV);
        if (receivedCheckMacValue !== calculatedCheckMacValue) {
            return res.status(400).send('0|ErrorMessage');
        }

        if (req.body.RtnCode === '1') {
            const order = await db.findOrderByMerchantTradeNo(req.body.MerchantTradeNo);
            if (!order) return res.status(404).send('0|OrderNotFound');

            if (order.status !== 'PAID') {
                await db.markOrderPaid(order.id, {
                    status: 'PAID',
                    payment_date: req.body.PaymentDate,
                    payment_type: req.body.PaymentType,
                });
                await db.createPurchase({
                    user_id: order.user_id,
                    product_id: order.product_id,
                    order_id: order.id,
                });
            }
        }

        res.send('1|OK');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('0|ErrorMessage');
    }
});

app.get('/api/products', async (_req, res) => {
    if (!requireDb(res)) return;
    try {
        res.json(await db.listProducts());
    } catch (error) {
        console.error('Fetch Products Error:', error);
        res.status(500).json({ error: 'Failed to fetch products', details: error.message || error });
    }
});

app.post('/api/products', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.createProduct !== 'function') return res.status(400).json({ error: 'Local products are unavailable.' });
    try {
        res.json(await db.createProduct(req.body || {}));
    } catch (error) {
        res.status(500).json({ error: 'Product creation failed', details: error.message || error });
    }
});

app.put('/api/products/:id', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.updateProduct !== 'function') return res.status(400).json({ error: 'Local products are unavailable.' });
    try {
        res.json(await db.updateProduct(req.params.id, req.body || {}));
    } catch (error) {
        res.status(500).json({ error: 'Product update failed', details: error.message || error });
    }
});

const allowedContentTables = new Set(['news', 'events', 'services', 'registrations', 'org_members', 'faqs', 'gallery', 'gallery_albums']);

app.post('/api/uploads/gallery', async (req, res) => {
    const { fileName = 'upload', dataUrl = '' } = req.body || {};
    const match = String(dataUrl).match(/^data:(image|video)\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Only base64 image/video uploads are supported.' });

    const extFromMime = match[2].replace('jpeg', 'jpg').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'bin';
    const originalExt = path.extname(String(fileName)).replace('.', '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    const ext = originalExt || extFromMime;
    const uploadDir = path.join(rootDir, 'uploads', 'gallery');
    const safeName = `${Date.now()}_${randomUUID()}.${ext}`;

    try {
        fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, safeName), Buffer.from(match[3], 'base64'));
        res.json({ url: `/uploads/gallery/${safeName}` });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed', details: error.message || error });
    }
});

app.get('/api/site-settings', async (_req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.getSiteSettings !== 'function') return res.status(400).json({ error: 'Local site settings are unavailable.' });
    res.json(await db.getSiteSettings());
});

app.put('/api/site-settings', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.updateSiteSettings !== 'function') return res.status(400).json({ error: 'Local site settings are unavailable.' });
    try {
        res.json(await db.updateSiteSettings(req.body || {}));
    } catch (error) {
        res.status(500).json({ error: 'Site settings update failed', details: error.message || error });
    }
});

app.get('/api/content/:table', async (req, res) => {
    if (!requireDb(res)) return;
    const table = req.params.table;
    if (!allowedContentTables.has(table)) return res.status(404).json({ error: 'Unsupported table' });
    try {
        res.json(await db.listContent(table));
    } catch (error) {
        res.status(500).json({ error: 'Content listing failed', details: error.message || error });
    }
});

app.post('/api/content/:table', async (req, res) => {
    if (!requireDb(res)) return;
    const table = req.params.table;
    if (!allowedContentTables.has(table)) return res.status(404).json({ error: 'Unsupported table' });
    try {
        res.json(await db.createContent(table, req.body || {}));
    } catch (error) {
        res.status(500).json({ error: 'Content creation failed', details: error.message || error });
    }
});

app.put('/api/content/:table/:id', async (req, res) => {
    if (!requireDb(res)) return;
    const table = req.params.table;
    if (!allowedContentTables.has(table)) return res.status(404).json({ error: 'Unsupported table' });
    try {
        res.json(await db.updateContent(table, req.params.id, req.body || {}));
    } catch (error) {
        res.status(500).json({ error: 'Content update failed', details: error.message || error });
    }
});

app.delete('/api/content/:table/:id', async (req, res) => {
    if (!requireDb(res)) return;
    const table = req.params.table;
    if (!allowedContentTables.has(table)) return res.status(404).json({ error: 'Unsupported table' });
    try {
        await db.deleteContent(table, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Content deletion failed', details: error.message || error });
    }
});

app.post('/api/manual-order', async (req, res) => {
    if (!requireDb(res)) return;

    const { userId, productId, amount = 0, status = 'PENDING', paymentType = 'MANUAL', merchantTradeNo } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'userId and productId are required.' });

    try {
        const order = await db.createOrder({
            user_id: userId,
            product_id: productId,
            amount,
            status,
            payment_type: paymentType,
            payment_date: status === 'PAID' ? new Date().toISOString() : null,
            merchant_trade_no: merchantTradeNo || `${paymentType}_${Date.now()}`,
        });

        if (status === 'PAID') {
            await db.createPurchase({
                user_id: userId,
                product_id: productId,
                order_id: order.id,
            });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Manual Order Error:', error);
        res.status(500).json({ error: 'Failed to create manual order', details: error.message || error });
    }
});

app.get('/api/orders', async (_req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.listOrders !== 'function') return res.status(400).json({ error: 'Local orders are unavailable.' });
    try {
        res.json(await db.listOrders());
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders', details: error.message || error });
    }
});

app.put('/api/orders/:id', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.updateOrder !== 'function') return res.status(400).json({ error: 'Local orders are unavailable.' });
    try {
        res.json(await db.updateOrder(req.params.id, req.body || {}));
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order', details: error.message || error });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    if (!requireDb(res)) return;
    if (typeof db.deleteOrder !== 'function') return res.status(400).json({ error: 'Local orders are unavailable.' });
    try {
        await db.deleteOrder(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete order', details: error.message || error });
    }
});

app.post('/api/purchases', async (req, res) => {
    if (!requireDb(res)) return;
    const { userId, productId, orderId = null } = req.body || {};
    if (!userId || !productId) return res.status(400).json({ error: 'userId and productId are required.' });
    try {
        await db.createPurchase({ user_id: userId, product_id: productId, order_id: orderId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to grant purchase', details: error.message || error });
    }
});

app.delete('/api/purchases', async (req, res) => {
    if (!requireDb(res)) return;
    const { userId, productId } = req.query;
    if (!userId || !productId) return res.status(400).json({ error: 'userId and productId are required.' });
    try {
        await db.deletePurchase(userId, productId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to revoke purchase', details: error.message || error });
    }
});

app.get('/api/my-library', async (req, res) => {
    if (!requireDb(res)) return;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });

    try {
        res.json(await db.listLibrary(userId));
    } catch (error) {
        console.error('Fetch Library Error:', error);
        res.status(500).json({ error: 'Failed to fetch library', details: error.message || error });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    if (!requireDb(res)) return;
    try {
        await db.deleteProductCascade(req.params.id);
        res.json({ success: true, message: 'Product and related orders deleted.' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ error: 'Failed to delete product', details: error.message || error, code: error.code });
    }
});

app.get('/api/download/:productId', async (req, res) => {
    if (!requireDb(res)) return;
    const { productId } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });

    try {
        const filePath = await db.getPurchasedProductFilePath(userId, productId);
        if (!filePath) return res.status(403).json({ error: 'No paid purchase record found for this product.' });
        res.json({ url: await db.createSignedDownloadUrl(filePath) });
    } catch (error) {
        console.error('Download Error:', error);
        res.status(500).json({ error: 'Failed to generate download link.', details: error.message || error });
    }
});

app.post('/api/line-notify', async (req, res) => {
    const { message } = req.body;
    const token = process.env.LINE_NOTIFY_TOKEN;
    if (!token) return res.status(500).json({ error: 'LINE_NOTIFY_TOKEN is missing.' });
    if (!message) return res.status(400).json({ error: 'message is required.' });

    try {
        const response = await fetch('https://notify-api.line.me/api/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${token}`,
            },
            body: new URLSearchParams({ message }),
        });
        const result = await response.json();
        res.status(response.status).json(response.ok ? { success: true, result } : { error: 'Failed to send LINE notification', details: result });
    } catch (error) {
        console.error('LINE Notify Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.get('/api/diag', async (_req, res) => {
    const results = {
        env: {
            PORT: port,
            DB_PROVIDER: db.provider,
            SUPABASE_URL: process.env.SUPABASE_URL ? 'PRESENT' : 'MISSING',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING',
            MYSQL_HOST: process.env.MYSQL_HOST || '127.0.0.1',
            MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'guangxing',
        },
    };

    try {
        if (!db.ready) return res.json({ ...results, database: { connected: false } });
        res.json({ ...results, database: { connected: true, provider: db.provider, ...(await db.diag()) } });
    } catch (error) {
        res.status(500).json({ ...results, database: { connected: false, error: error.message } });
    }
});

const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(port, () => {
        console.log('===========================================================');
        console.log(`Local website/API running at http://localhost:${port}`);
        console.log(`Database provider: ${db.provider} (${db.ready ? 'ready' : 'not ready'})`);
        console.log(`Static dist: ${fs.existsSync(distDir) ? distDir : 'not built yet'}`);
        console.log('===========================================================');
    });
}

export default app;
