import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { loadDatabaseConfig } from './db-config.js';

const toCamelProduct = (p = {}) => ({
    id: p.id,
    title: p.title,
    author: p.author,
    content: p.content,
    description: p.description,
    category: p.category,
    price: Number(p.price || 0),
    filePath: p.file_path,
    previewUrl: p.preview_url,
    fileType: p.file_type,
    attachments: typeof p.attachments === 'string' ? JSON.parse(p.attachments || '[]') : (p.attachments || []),
    tags: typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : (p.tags || []),
    isLimitedTime: Boolean(p.is_limited_time),
    promotionEndDate: p.promotion_end_date,
    createdAt: p.created_at,
    updatedAt: p.updated_at
});

const parseJson = (value, fallback = {}) => {
    if (!value) return fallback;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const toCamelContent = (table, row = {}) => {
    if (table === 'site_settings') {
        return {
            templeName: row.temple_name,
            address: row.address,
            phone: row.phone,
            lineUrl: row.line_url,
            heroTitle: row.hero_title,
            heroSubtitle: row.hero_subtitle,
            heroImage: row.hero_image,
            deityImage: row.deity_image,
            deityTitle: row.deity_title,
            deityIntro: row.deity_intro,
            deityBirthday: row.deity_birthday,
            deityBirthdayLabel: row.deity_birthday_label,
            deityDuty: row.deity_duty,
            deityDutyLabel: row.deity_duty_label,
            historyImageRoof: row.history_image_roof,
            historyRoofTitle: row.history_roof_title,
            historyRoofDesc: row.history_roof_desc,
            historyImageStone: row.history_image_stone,
            historyStoneTitle: row.history_stone_title,
            historyStoneDesc: row.history_stone_desc,
            historyTitle1: row.history_title1,
            historyDesc1: row.history_desc1,
            historyTitle2: row.history_title2,
            historyDesc2: row.history_desc2,
            historyTitle3: row.history_title3,
            historyDesc3: row.history_desc3,
            configDonation: parseJson(row.config_donation, {}),
            configLight: parseJson(row.config_light, {}),
            configEvent: parseJson(row.config_event, {}),
        };
    }
    if (table === 'events') {
        return {
            id: row.id,
            date: row.date,
            endDate: row.end_date,
            lunarDate: row.lunar_date,
            lunarEndDate: row.lunar_end_date,
            title: row.title,
            description: row.description,
            time: row.time,
            type: row.type,
            fieldConfig: parseJson(row.field_config, undefined),
        };
    }
    if (table === 'services') {
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            iconName: row.icon_name,
            price: Number(row.price || 0),
            type: row.type,
            lightDurationDays: row.light_duration_days ? Number(row.light_duration_days) : undefined,
            fieldConfig: parseJson(row.field_config, undefined),
        };
    }
    if (table === 'registrations') {
        return {
            id: row.id,
            serviceId: row.service_id,
            serviceTitle: row.service_title,
            name: row.name,
            phone: row.phone,
            birthYear: row.birth_year,
            birthMonth: row.birth_month,
            birthDay: row.birth_day,
            birthHour: row.birth_hour,
            city: row.city,
            district: row.district,
            road: row.road,
            addressDetail: row.address_detail,
            gender: row.gender,
            amount: Number(row.amount || 0),
            status: row.status,
            isProcessed: Boolean(row.is_processed),
            lightStartDate: row.light_start_date,
            lightExpireDate: row.light_expire_date,
            lightDurationDays: row.light_duration_days ? Number(row.light_duration_days) : undefined,
            paymentMethod: row.payment_method,
            paymentDetails: row.payment_details,
            bankLastFive: row.bank_last_five,
            idNumber: row.id_number,
            userId: row.user_id,
            createdAt: row.created_at,
        };
    }
    if (table === 'org_members') {
        return {
            id: row.id,
            name: row.name,
            title: row.title,
            image: row.image,
            category: row.category,
            order: row.sort_order,
        };
    }
    if (table === 'gallery_albums') {
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            coverImageUrl: row.cover_image_url,
            eventDate: row.event_date,
            createdAt: row.created_at,
        };
    }
    if (table === 'gallery') {
        return {
            id: row.id,
            type: row.type,
            url: row.url,
            title: row.title,
            albumId: row.album_id,
            createdAt: row.created_at,
        };
    }
    return row;
};

const contentTableConfig = {
    news: {
        order: 'date desc',
        columns: ['date', 'title', 'category'],
        map: (item) => ({ date: item.date || '', title: item.title || '', category: item.category || '' }),
    },
    events: {
        order: 'date asc',
        columns: ['date', 'end_date', 'lunar_date', 'lunar_end_date', 'title', 'description', 'time', 'type', 'field_config'],
        map: (item) => ({
            date: item.date || '',
            end_date: item.endDate || item.end_date || null,
            lunar_date: item.lunarDate || item.lunar_date || '',
            lunar_end_date: item.lunarEndDate || item.lunar_end_date || null,
            title: item.title || '',
            description: item.description || '',
            time: item.time || '',
            type: item.type || 'FESTIVAL',
            field_config: JSON.stringify(item.fieldConfig || item.field_config || {}),
        }),
    },
    services: {
        order: 'created_at desc',
        columns: ['title', 'description', 'icon_name', 'price', 'type', 'light_duration_days', 'field_config'],
        map: (item) => ({
            title: item.title || '',
            description: item.description || '',
            icon_name: item.iconName || item.icon_name || 'Sparkles',
            price: Number(item.price || 0),
            type: item.type || 'RITUAL',
            light_duration_days: item.lightDurationDays || item.light_duration_days || null,
            field_config: JSON.stringify(item.fieldConfig || item.field_config || {}),
        }),
    },
    registrations: {
        order: 'created_at desc',
        columns: ['service_id', 'service_title', 'name', 'phone', 'birth_year', 'birth_month', 'birth_day', 'birth_hour', 'city', 'district', 'road', 'address_detail', 'gender', 'amount', 'status', 'is_processed', 'light_start_date', 'light_expire_date', 'light_duration_days', 'payment_method', 'payment_details', 'bank_last_five', 'id_number', 'user_id'],
        map: (item) => {
            const has = (camel, snake = camel) => item[camel] !== undefined || item[snake] !== undefined;
            const val = (camel, snake = camel, fallback = undefined) => item[camel] !== undefined ? item[camel] : item[snake] !== undefined ? item[snake] : fallback;
            return {
                service_id: has('serviceId', 'service_id') ? val('serviceId', 'service_id') : undefined,
                service_title: has('serviceTitle', 'service_title') ? val('serviceTitle', 'service_title') : undefined,
                name: has('name') ? val('name') : undefined,
                phone: has('phone') ? val('phone') : undefined,
                birth_year: has('birthYear', 'birth_year') ? val('birthYear', 'birth_year') : undefined,
                birth_month: has('birthMonth', 'birth_month') ? val('birthMonth', 'birth_month') : undefined,
                birth_day: has('birthDay', 'birth_day') ? val('birthDay', 'birth_day') : undefined,
                birth_hour: has('birthHour', 'birth_hour') ? val('birthHour', 'birth_hour') : undefined,
                city: has('city') ? val('city') : undefined,
                district: has('district') ? val('district') : undefined,
                road: has('road') ? val('road') : undefined,
                address_detail: has('addressDetail', 'address_detail') ? val('addressDetail', 'address_detail') : undefined,
                gender: has('gender') ? val('gender') : undefined,
                amount: has('amount') ? Number(val('amount') || 0) : undefined,
                status: has('status') ? val('status') : undefined,
                is_processed: has('isProcessed', 'is_processed') ? (val('isProcessed', 'is_processed') ? 1 : 0) : undefined,
                light_start_date: has('lightStartDate', 'light_start_date') ? val('lightStartDate', 'light_start_date') || null : undefined,
                light_expire_date: has('lightExpireDate', 'light_expire_date') ? val('lightExpireDate', 'light_expire_date') || null : undefined,
                light_duration_days: has('lightDurationDays', 'light_duration_days') ? val('lightDurationDays', 'light_duration_days') || null : undefined,
                payment_method: has('paymentMethod', 'payment_method') ? val('paymentMethod', 'payment_method') : undefined,
                payment_details: has('paymentDetails', 'payment_details') ? val('paymentDetails', 'payment_details') : undefined,
                bank_last_five: has('bankLastFive', 'bank_last_five') ? val('bankLastFive', 'bank_last_five') : undefined,
                id_number: has('idNumber', 'id_number') ? val('idNumber', 'id_number') : undefined,
                user_id: has('userId', 'user_id') ? val('userId', 'user_id') : undefined,
            };
        },
    },
    org_members: {
        order: 'sort_order asc, created_at desc',
        columns: ['name', 'title', 'image', 'category', 'sort_order'],
        map: (item) => ({
            name: item.name || '',
            title: item.title || '',
            image: item.image || '',
            category: item.category || 'STAFF',
            sort_order: Number(item.order || item.sort_order || 0),
        }),
    },
    faqs: {
        order: 'created_at desc',
        columns: ['question', 'answer'],
        map: (item) => ({ question: item.question || '', answer: item.answer || '' }),
    },
    gallery_albums: {
        order: 'created_at desc',
        columns: ['title', 'description', 'cover_image_url', 'event_date'],
        map: (item) => ({
            title: item.title || '',
            description: item.description || '',
            cover_image_url: item.coverImageUrl || item.cover_image_url || '',
            event_date: item.eventDate || item.event_date || null,
        }),
    },
    gallery: {
        order: 'created_at desc',
        columns: ['type', 'url', 'title', 'album_id'],
        map: (item) => ({
            type: item.type || 'IMAGE',
            url: item.url || '',
            title: item.title || '',
            album_id: item.albumId || item.album_id || null,
        }),
    },
};

const mysqlDate = (value) => {
    if (!value) return null;
    return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
};

const sqliteDate = (value) => {
    if (!value) return null;
    return new Date(value).toISOString();
};

const createSupabaseAdapter = ({ url, key }) => {
    const client = key ? createClient(url, key) : null;

    return {
        provider: 'supabase',
        client,
        ready: Boolean(client),

        async createOrder(input) {
            const { data, error } = await client.from('orders').insert([input]).select().single();
            if (error) throw error;
            return data;
        },

        async findOrderByMerchantTradeNo(merchantTradeNo) {
            const { data, error } = await client.from('orders').select('*').eq('merchant_trade_no', merchantTradeNo).single();
            if (error) throw error;
            return data;
        },

        async markOrderPaid(id, payment) {
            const { error } = await client.from('orders').update(payment).eq('id', id);
            if (error) throw error;
        },

        async createPurchase(input) {
            const { error } = await client.from('purchases').insert([input]);
            if (error && error.code !== '23505') throw error;
        },

        async listProducts() {
            const { data, error } = await client.from('digital_products').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data.map(toCamelProduct);
        },

        async listLibrary(userId) {
            const { data, error } = await client
                .from('purchases')
                .select('id, created_at, digital_products!product_id (*)')
                .eq('user_id', userId);
            if (error) throw error;
            return data.map((item) => ({
                id: item.id,
                createdAt: item.created_at,
                product: item.digital_products ? toCamelProduct(item.digital_products) : null
            }));
        },

        async deleteProductCascade(id) {
            const { error: orderError } = await client.from('orders').delete().eq('product_id', id);
            if (orderError) throw orderError;
            const { error: productError } = await client.from('digital_products').delete().eq('id', id);
            if (productError) throw productError;
        },

        async getPurchasedProductFilePath(userId, productId) {
            const { data: purchase, error: authError } = await client
                .from('purchases')
                .select('*')
                .eq('user_id', userId)
                .eq('product_id', productId)
                .single();
            if (authError || !purchase) return null;

            const { data: product, error: prodError } = await client
                .from('digital_products')
                .select('file_path')
                .eq('id', productId)
                .single();
            if (prodError || !product) return null;
            return product.file_path;
        },

        async createSignedDownloadUrl(filePath) {
            const { data, error } = await client.storage.from('scriptures').createSignedUrl(filePath, 3600);
            if (error) throw error;
            return data.signedUrl;
        },

        async diag() {
            const results = {};
            const { error: productsError, count: productsCount } = await client
                .from('digital_products')
                .select('*', { count: 'exact', head: true });
            results.products = { ok: !productsError, count: productsCount, error: productsError?.message || null };
            const { error: purchasesError } = await client.from('purchases').select('id').limit(1);
            results.purchasesTable = { exists: !purchasesError, error: purchasesError?.message || null };
            const { error: ordersError } = await client.from('orders').select('id').limit(1);
            results.ordersTable = { exists: !ordersError, error: ordersError?.message || null };
            return results;
        }
    };
};

const createMysqlAdapter = async () => {
    const config = loadDatabaseConfig();
    const pool = mysql.createPool({
        host: config.mysql.host,
        port: config.mysql.port,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database,
        waitForConnections: true,
        connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
        namedPlaceholders: true
    });

    return {
        provider: 'mysql',
        pool,
        ready: true,
        client: null,

        async createOrder(input) {
            const id = randomUUID();
            await pool.execute(
                `insert into orders
                (id, user_id, product_id, amount, status, merchant_trade_no, payment_type, payment_date)
                values (:id, :user_id, :product_id, :amount, :status, :merchant_trade_no, :payment_type, :payment_date)`,
                { id, ...input, payment_type: input.payment_type || null, payment_date: mysqlDate(input.payment_date) }
            );
            return { id, ...input };
        },

        async findOrderByMerchantTradeNo(merchantTradeNo) {
            const [rows] = await pool.execute('select * from orders where merchant_trade_no = ? limit 1', [merchantTradeNo]);
            if (!rows.length) return null;
            return rows[0];
        },

        async markOrderPaid(id, payment) {
            await pool.execute(
                'update orders set status = ?, payment_date = ?, payment_type = ?, updated_at = current_timestamp where id = ?',
                [payment.status, mysqlDate(payment.payment_date), payment.payment_type, id]
            );
        },

        async createPurchase(input) {
            await pool.execute(
                `insert ignore into purchases (id, user_id, product_id, order_id)
                values (?, ?, ?, ?)`,
                [randomUUID(), input.user_id, input.product_id, input.order_id || null]
            );
        },

        async listProducts() {
            const [rows] = await pool.execute('select * from digital_products order by created_at desc');
            return rows.map(toCamelProduct);
        },

        async listLibrary(userId) {
            const [rows] = await pool.execute(
                `select p.id as purchase_id, p.created_at as purchase_created_at, dp.*
                 from purchases p
                 join digital_products dp on dp.id = p.product_id
                 left join orders o on o.id = p.order_id
                 where p.user_id = ? and (o.id is null or o.status = 'PAID')
                 order by p.created_at desc`,
                [userId]
            );
            return rows.map((row) => ({
                id: row.purchase_id,
                createdAt: row.purchase_created_at,
                product: toCamelProduct(row)
            }));
        },

        async deleteProductCascade(id) {
            await pool.execute('delete from orders where product_id = ?', [id]);
            await pool.execute('delete from digital_products where id = ?', [id]);
        },

        async getPurchasedProductFilePath(userId, productId) {
            const [rows] = await pool.execute(
                `select dp.file_path
                 from purchases p
                 join digital_products dp on dp.id = p.product_id
                 left join orders o on o.id = p.order_id
                 where p.user_id = ? and p.product_id = ? and (o.id is null or o.status = 'PAID')
                 limit 1`,
                [userId, productId]
            );
            return rows[0]?.file_path || null;
        },

        async createSignedDownloadUrl(filePath) {
            if (/^https?:\/\//i.test(filePath)) return filePath;
            return `/uploads/${filePath.replace(/^\/+/, '')}`;
        },

        async diag() {
            const [productRows] = await pool.execute('select count(*) as count from digital_products');
            await pool.execute('select id from purchases limit 1');
            await pool.execute('select id from orders limit 1');
            return {
                products: { ok: true, count: productRows[0].count, error: null },
                purchasesTable: { exists: true, error: null },
                ordersTable: { exists: true, error: null }
            };
        }
    };
};

const seedSqliteAdmin = (db) => {
    const email = process.env.ADMIN_EMAIL || 'xvn5002036@gmail.com';
    const password = process.env.ADMIN_PASSWORD || '112221';
    const existing = db.prepare('select id from profiles where email = ?').get(email);
    const passwordHash = bcrypt.hashSync(password, 12);

    if (existing) {
        db.prepare(`
            update profiles
            set role = 'admin', password_hash = ?, updated_at = current_timestamp
            where email = ?
        `).run(passwordHash, email);
        return existing.id;
    }

    const id = randomUUID();
    db.prepare(`
        insert into profiles (id, email, full_name, role, password_hash)
        values (?, ?, ?, 'admin', ?)
    `).run(id, email, '系統管理員', passwordHash);
    return id;
};

const ensureSqliteColumn = (db, table, column, definition) => {
    const tableExists = db.prepare("select name from sqlite_master where type = 'table' and name = ?").get(table);
    if (!tableExists) return;
    const columns = db.prepare(`pragma table_info(${table})`).all().map((row) => row.name);
    if (!columns.includes(column)) db.prepare(`alter table ${table} add column ${column} ${definition}`).run();
};

const createSqliteAdapter = async () => {
    const config = loadDatabaseConfig();
    fs.mkdirSync(path.dirname(config.sqlite.file), { recursive: true });
    const db = new Database(config.sqlite.file);
    db.pragma('foreign_keys = ON');
    ensureSqliteColumn(db, 'services', 'light_duration_days', 'INTEGER');
    ensureSqliteColumn(db, 'registrations', 'light_start_date', 'TEXT');
    ensureSqliteColumn(db, 'registrations', 'light_expire_date', 'TEXT');
    ensureSqliteColumn(db, 'registrations', 'light_duration_days', 'INTEGER');

    const schemaPath = path.resolve('sqlite_schema.sql');
    db.exec(fs.readFileSync(schemaPath, 'utf-8'));
    const adminId = seedSqliteAdmin(db);

    return {
        provider: 'sqlite',
        file: config.sqlite.file,
        db,
        ready: true,
        client: null,

        async createOrder(input) {
            const id = randomUUID();
            db.prepare(`
                insert into orders
                (id, user_id, product_id, amount, status, merchant_trade_no, payment_type, payment_date)
                values (@id, @user_id, @product_id, @amount, @status, @merchant_trade_no, @payment_type, @payment_date)
            `).run({
                id,
                ...input,
                payment_type: input.payment_type || null,
                payment_date: sqliteDate(input.payment_date)
            });
            return { id, ...input };
        },

        async findOrderByMerchantTradeNo(merchantTradeNo) {
            return db.prepare('select * from orders where merchant_trade_no = ? limit 1').get(merchantTradeNo) || null;
        },

        async markOrderPaid(id, payment) {
            db.prepare(`
                update orders
                set status = ?, payment_date = ?, payment_type = ?, updated_at = current_timestamp
                where id = ?
            `).run(payment.status, sqliteDate(payment.payment_date), payment.payment_type, id);
        },

        async createPurchase(input) {
            db.prepare(`
                insert or ignore into purchases (id, user_id, product_id, order_id)
                values (?, ?, ?, ?)
            `).run(randomUUID(), input.user_id, input.product_id, input.order_id || null);
        },

        async deletePurchase(userId, productId) {
            db.prepare('delete from purchases where user_id = ? and product_id = ?').run(userId, productId);
        },

        async listProducts() {
            return db.prepare('select * from digital_products order by created_at desc').all().map(toCamelProduct);
        },

        async createProduct(item) {
            const id = randomUUID();
            db.prepare(`
                insert into digital_products
                (id, title, author, content, description, category, price, file_path, preview_url, file_type, attachments, tags, is_limited_time, promotion_end_date)
                values (@id, @title, @author, @content, @description, @category, @price, @file_path, @preview_url, @file_type, @attachments, @tags, @is_limited_time, @promotion_end_date)
            `).run({
                id,
                title: item.title || '',
                author: item.author || '',
                content: item.content || '',
                description: item.description || '',
                category: item.category || '道藏藏書',
                price: Number(item.price || 0),
                file_path: item.filePath || item.file_path || '',
                preview_url: item.previewUrl || item.preview_url || '',
                file_type: item.fileType || item.file_type || 'HTML',
                attachments: JSON.stringify(item.attachments || []),
                tags: JSON.stringify(item.tags || []),
                is_limited_time: item.isLimitedTime || item.is_limited_time ? 1 : 0,
                promotion_end_date: item.promotionEndDate || item.promotion_end_date || null,
            });
            return { id, ...item };
        },

        async updateProduct(id, item) {
            const current = db.prepare('select * from digital_products where id = ?').get(id);
            if (!current) throw new Error('Product not found');
            db.prepare(`
                update digital_products
                set title = @title,
                    author = @author,
                    content = @content,
                    description = @description,
                    category = @category,
                    price = @price,
                    file_path = @file_path,
                    preview_url = @preview_url,
                    file_type = @file_type,
                    attachments = @attachments,
                    tags = @tags,
                    is_limited_time = @is_limited_time,
                    promotion_end_date = @promotion_end_date,
                    updated_at = current_timestamp
                where id = @id
            `).run({
                id,
                title: item.title ?? current.title,
                author: item.author ?? current.author,
                content: item.content ?? current.content,
                description: item.description ?? current.description,
                category: item.category ?? current.category,
                price: Number(item.price ?? current.price ?? 0),
                file_path: item.filePath ?? item.file_path ?? current.file_path,
                preview_url: item.previewUrl ?? item.preview_url ?? current.preview_url,
                file_type: item.fileType ?? item.file_type ?? current.file_type,
                attachments: JSON.stringify(item.attachments ?? parseJson(current.attachments, [])),
                tags: JSON.stringify(item.tags ?? parseJson(current.tags, [])),
                is_limited_time: item.isLimitedTime ?? item.is_limited_time ?? current.is_limited_time ? 1 : 0,
                promotion_end_date: item.promotionEndDate ?? item.promotion_end_date ?? current.promotion_end_date,
            });
            return toCamelProduct(db.prepare('select * from digital_products where id = ?').get(id));
        },

        async getSiteSettings() {
            const row = db.prepare('select * from site_settings where id = ? limit 1').get('default');
            return row ? toCamelContent('site_settings', row) : null;
        },

        async updateSiteSettings(updates) {
            const map = {
                templeName: 'temple_name', address: 'address', phone: 'phone', lineUrl: 'line_url',
                heroTitle: 'hero_title', heroSubtitle: 'hero_subtitle', heroImage: 'hero_image',
                deityImage: 'deity_image', deityTitle: 'deity_title', deityIntro: 'deity_intro',
                deityBirthday: 'deity_birthday', deityBirthdayLabel: 'deity_birthday_label',
                deityDuty: 'deity_duty', deityDutyLabel: 'deity_duty_label',
                historyImageRoof: 'history_image_roof', historyRoofTitle: 'history_roof_title',
                historyRoofDesc: 'history_roof_desc', historyImageStone: 'history_image_stone',
                historyStoneTitle: 'history_stone_title', historyStoneDesc: 'history_stone_desc',
                historyTitle1: 'history_title1', historyDesc1: 'history_desc1',
                historyTitle2: 'history_title2', historyDesc2: 'history_desc2',
                historyTitle3: 'history_title3', historyDesc3: 'history_desc3',
                configDonation: 'config_donation', configLight: 'config_light', configEvent: 'config_event',
            };
            const entries = Object.entries(updates || {}).filter(([key]) => map[key]);
            if (entries.length) {
                const values = { id: 'default' };
                const sets = entries.map(([key, value]) => {
                    const column = map[key];
                    values[column] = typeof value === 'object' ? JSON.stringify(value) : value;
                    return `${column} = @${column}`;
                });
                db.prepare(`update site_settings set ${sets.join(', ')}, updated_at = current_timestamp where id = @id`).run(values);
            }
            return this.getSiteSettings();
        },

        async listContent(table) {
            const config = contentTableConfig[table];
            if (!config) throw new Error(`Unsupported table: ${table}`);
            return db.prepare(`select * from ${table} order by ${config.order}`).all().map((row) => toCamelContent(table, row));
        },

        async createContent(table, item) {
            const config = contentTableConfig[table];
            if (!config) throw new Error(`Unsupported table: ${table}`);
            const id = randomUUID();
            const mapped = config.map(item || {});
            const columns = ['id', ...config.columns];
            const values = { id, ...mapped };
            db.prepare(`insert into ${table} (${columns.join(', ')}) values (${columns.map((col) => `@${col}`).join(', ')})`).run(values);
            return { id, ...item };
        },

        async updateContent(table, id, item) {
            const config = contentTableConfig[table];
            if (!config) throw new Error(`Unsupported table: ${table}`);
            const mapped = config.map(item || {});
            const updates = Object.entries(mapped).filter(([, value]) => value !== undefined);
            if (updates.length) {
                const values = { id };
                const sets = updates.map(([column, value]) => {
                    values[column] = value;
                    return `${column} = @${column}`;
                });
                db.prepare(`update ${table} set ${sets.join(', ')}, updated_at = current_timestamp where id = @id`).run(values);
            }
            return db.prepare(`select * from ${table} where id = ?`).get(id);
        },

        async deleteContent(table, id) {
            const config = contentTableConfig[table];
            if (!config) throw new Error(`Unsupported table: ${table}`);
            db.prepare(`delete from ${table} where id = ?`).run(id);
        },

        async listLibrary(userId) {
            return db.prepare(`
                select p.id as purchase_id, p.created_at as purchase_created_at, dp.*
                from purchases p
                join digital_products dp on dp.id = p.product_id
                left join orders o on o.id = p.order_id
                where p.user_id = ? and (o.id is null or o.status = 'PAID')
                order by p.created_at desc
            `).all(userId).map((row) => ({
                id: row.purchase_id,
                createdAt: row.purchase_created_at,
                product: toCamelProduct(row)
            }));
        },

        async listOrders() {
            return db.prepare(`
                select o.*, dp.title, dp.description, dp.category, dp.price as product_price, dp.file_type, dp.file_path, dp.preview_url, dp.created_at as product_created_at
                from orders o
                left join digital_products dp on dp.id = o.product_id
                order by o.created_at desc
            `).all().map((row) => ({
                id: row.id,
                userId: row.user_id,
                productId: row.product_id,
                amount: Number(row.amount || 0),
                status: row.status,
                merchantTradeNo: row.merchant_trade_no,
                paymentDate: row.payment_date,
                paymentType: row.payment_type,
                createdAt: row.created_at,
                product: row.title ? {
                    id: row.product_id,
                    title: row.title,
                    description: row.description,
                    category: row.category,
                    price: Number(row.product_price || 0),
                    fileType: row.file_type,
                    filePath: row.file_path,
                    previewUrl: row.preview_url,
                    createdAt: row.product_created_at,
                } : undefined
            }));
        },

        async updateOrder(id, updates) {
            const current = db.prepare('select * from orders where id = ?').get(id);
            if (!current) throw new Error('Order not found');
            const nextStatus = updates.status || current.status;
            const nextPaymentDate = updates.paymentDate || updates.payment_date || (nextStatus === 'PAID' && !current.payment_date ? new Date().toISOString() : current.payment_date);
            const nextPaymentType = updates.paymentType || updates.payment_type || (nextStatus === 'PAID' ? 'MANUAL' : current.payment_type);
            db.prepare(`
                update orders
                set status = ?, payment_date = ?, payment_type = ?, updated_at = current_timestamp
                where id = ?
            `).run(nextStatus, sqliteDate(nextPaymentDate), nextPaymentType, id);
            if (nextStatus === 'PAID') {
                await this.createPurchase({ user_id: current.user_id, product_id: current.product_id, order_id: id });
            } else {
                db.prepare('delete from purchases where order_id = ?').run(id);
            }
            return db.prepare('select * from orders where id = ?').get(id);
        },

        async deleteOrder(id) {
            db.prepare('delete from purchases where order_id = ?').run(id);
            db.prepare('delete from orders where id = ?').run(id);
        },

        async deleteProductCascade(id) {
            db.prepare('delete from orders where product_id = ?').run(id);
            db.prepare('delete from digital_products where id = ?').run(id);
        },

        async getPurchasedProductFilePath(userId, productId) {
            const row = db.prepare(`
                select dp.file_path
                from purchases p
                join digital_products dp on dp.id = p.product_id
                left join orders o on o.id = p.order_id
                where p.user_id = ? and p.product_id = ? and (o.id is null or o.status = 'PAID')
                limit 1
            `).get(userId, productId);
            return row?.file_path || null;
        },

        async createSignedDownloadUrl(filePath) {
            if (/^https?:\/\//i.test(filePath)) return filePath;
            return `/uploads/${String(filePath).replace(/^\/+/, '')}`;
        },

        async diag() {
            const productRows = db.prepare('select count(*) as count from digital_products').get();
            const admin = db.prepare('select id, email, role from profiles where id = ?').get(adminId);
            return {
                sqliteFile: config.sqlite.file,
                products: { ok: true, count: productRows.count, error: null },
                purchasesTable: { exists: true, error: null },
                ordersTable: { exists: true, error: null },
                admin
            };
        },

        async verifyAdmin(email, password) {
            const profile = db.prepare('select id, email, full_name, role, password_hash from profiles where email = ? limit 1').get(email);
            if (!profile || profile.role !== 'admin' || !profile.password_hash) return null;
            if (!bcrypt.compareSync(password, profile.password_hash)) return null;
            return {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                role: profile.role
            };
        },

        async registerUser(email, password) {
            const normalizedEmail = String(email || '').trim().toLowerCase();
            if (!normalizedEmail || !String(password || '').trim()) {
                const error = new Error('email and password are required.');
                error.status = 400;
                throw error;
            }

            const existing = db.prepare('select id from profiles where email = ? limit 1').get(normalizedEmail);
            if (existing) {
                const error = new Error('此信箱已被註冊');
                error.status = 409;
                throw error;
            }

            const id = randomUUID();
            const passwordHash = bcrypt.hashSync(password, 12);
            db.prepare(`
                insert into profiles (id, email, full_name, role, password_hash)
                values (?, ?, ?, 'user', ?)
            `).run(id, normalizedEmail, '新會員', passwordHash);

            return {
                id,
                email: normalizedEmail,
                fullName: '新會員',
                role: 'user'
            };
        },

        async verifyUser(email, password) {
            const normalizedEmail = String(email || '').trim().toLowerCase();
            const profile = db.prepare('select * from profiles where email = ? limit 1').get(normalizedEmail);
            if (!profile || !profile.password_hash) return null;
            if (!bcrypt.compareSync(password, profile.password_hash)) return null;
            return {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                phone: profile.phone,
                birthYear: profile.birth_year,
                birthMonth: profile.birth_month,
                birthDay: profile.birth_day,
                birthHour: profile.birth_hour,
                city: profile.city,
                district: profile.district,
                address: profile.address,
                gender: profile.gender,
                role: profile.role,
                createdAt: profile.created_at
            };
        },

        async getProfile(userId) {
            const profile = db.prepare('select * from profiles where id = ? limit 1').get(userId);
            if (!profile) return null;
            return {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                phone: profile.phone,
                birthYear: profile.birth_year,
                birthMonth: profile.birth_month,
                birthDay: profile.birth_day,
                birthHour: profile.birth_hour,
                city: profile.city,
                district: profile.district,
                address: profile.address,
                gender: profile.gender,
                role: profile.role,
                createdAt: profile.created_at
            };
        },

        async listProfiles() {
            return db.prepare(`
                select p.*,
                       count(pu.id) as purchase_count
                from profiles p
                left join purchases pu on pu.user_id = p.id
                group by p.id
                order by p.created_at desc
            `).all().map((profile) => ({
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                phone: profile.phone,
                birthYear: profile.birth_year,
                birthMonth: profile.birth_month,
                birthDay: profile.birth_day,
                birthHour: profile.birth_hour,
                city: profile.city,
                district: profile.district,
                address: profile.address,
                gender: profile.gender,
                role: profile.role,
                createdAt: profile.created_at,
                purchaseCount: profile.purchase_count || 0
            }));
        },

        async listPurchases(userId) {
            return db.prepare(`
                select p.id, p.user_id, p.product_id, p.order_id, p.created_at,
                       dp.title as product_title, dp.price as product_price
                from purchases p
                left join digital_products dp on dp.id = p.product_id
                where p.user_id = ?
                order by p.created_at desc
            `).all(userId).map((purchase) => ({
                id: purchase.id,
                userId: purchase.user_id,
                productId: purchase.product_id,
                orderId: purchase.order_id,
                createdAt: purchase.created_at,
                productTitle: purchase.product_title,
                productPrice: purchase.product_price
            }));
        },

        async deleteProfileCascade(userId) {
            const profile = db.prepare('select id, email, role from profiles where id = ? limit 1').get(userId);
            if (!profile) {
                const error = new Error('會員不存在');
                error.status = 404;
                throw error;
            }
            if (profile.role === 'admin') {
                const error = new Error('管理員帳號不能刪除');
                error.status = 400;
                throw error;
            }

            const tableExists = (table) => Boolean(db.prepare("select name from sqlite_master where type = 'table' and name = ?").get(table));
            const countRows = (table) => tableExists(table)
                ? db.prepare(`select count(*) as count from ${table} where user_id = ?`).get(userId).count
                : 0;

            const summary = {
                purchases: countRows('purchases'),
                orders: countRows('orders'),
                bookmarks: countRows('bookmarks'),
                notes: countRows('notes'),
                registrations: tableExists('registrations') ? db.prepare('select count(*) as count from registrations where user_id = ?').get(userId).count : 0,
            };

            const tx = db.transaction(() => {
                if (tableExists('purchases')) db.prepare('delete from purchases where user_id = ?').run(userId);
                if (tableExists('orders')) db.prepare('delete from orders where user_id = ?').run(userId);
                if (tableExists('bookmarks')) db.prepare('delete from bookmarks where user_id = ?').run(userId);
                if (tableExists('notes')) db.prepare('delete from notes where user_id = ?').run(userId);
                if (tableExists('registrations')) db.prepare('delete from registrations where user_id = ?').run(userId);
                db.prepare('delete from profiles where id = ?').run(userId);
            });
            tx();

            return { deletedUserId: userId, email: profile.email, ...summary };
        },

        async updateProfile(userId, updates) {
            db.prepare(`
                update profiles
                set full_name = @fullName,
                    phone = @phone,
                    birth_year = @birthYear,
                    birth_month = @birthMonth,
                    birth_day = @birthDay,
                    birth_hour = @birthHour,
                    city = @city,
                    district = @district,
                    address = @address,
                    gender = @gender,
                    updated_at = current_timestamp
                where id = @id
            `).run({
                id: userId,
                fullName: updates.fullName || '',
                phone: updates.phone || '',
                birthYear: updates.birthYear || '',
                birthMonth: updates.birthMonth || '',
                birthDay: updates.birthDay || '',
                birthHour: updates.birthHour || '',
                city: updates.city || '',
                district: updates.district || '',
                address: updates.address || '',
                gender: updates.gender || 'M'
            });
            return this.getProfile(userId);
        }
    };
};

export const createDb = async () => {
    const config = loadDatabaseConfig();
    const provider = config.provider;
    if (provider === 'sqlite') {
        return createSqliteAdapter();
    }

    if (provider === 'mysql' || provider === 'xampp') {
        return createMysqlAdapter();
    }

    const url = config.supabase.url || 'https://gmswwklptwtxceomjrbm.supabase.co';
    const key = config.supabase.serviceRoleKey;
    return createSupabaseAdapter({ url, key });
};
