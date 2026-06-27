import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse src/config.ts manually
const configTsPath = path.resolve('..', 'src', 'config.ts');
let supabaseUrl = 'https://gmswwklptwtxceomjrbm.supabase.co';
let supabaseKey = '';

try {
    const content = fs.readFileSync(configTsPath, 'utf-8');
    const urlMatch = content.match(/SUPABASE_URL\s*=\s*(['"`])(.*?)\1/);
    if (urlMatch) supabaseUrl = urlMatch[2];
    const keyMatch = content.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(['"`])(.*?)\1/);
    if (keyMatch) supabaseKey = keyMatch[2];
} catch (err) {
    console.error('Failed to read config.ts');
}

if (!supabaseKey) {
    console.error('No service role key found in config.ts');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
    console.log('--- Checking Latest Orders ---');
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching orders:', error.message);
    } else {
        console.log('Latest 5 orders:');
        data.forEach(o => {
            console.log(`ID: ${o.id}, Status: ${o.status}, CreatedAt: ${o.created_at}, MerchantTradeNo: ${o.merchant_trade_no}`);
        });
    }
}

checkOrders();
