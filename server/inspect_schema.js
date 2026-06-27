import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmswwklptwtxceomjrbm.supabase.co';
const supabaseKey = 'sb_publishable_SbF7J4kDf6jA1-yOzrtX2w_C0WBVg1C'; // Anon key from config.ts

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('--- Inspecting Table Structures (Anon Key) ---');
    
    // Check digital_products (Public Read)
    console.log('\nTable: digital_products');
    const { data: cols, error: colErr } = await supabase.from('digital_products').select('*').limit(1);
    if (colErr) console.log('Error:', colErr.message);
    else if (cols && cols.length > 0) console.log('Columns found:', Object.keys(cols[0]).join(', '));
    else console.log('Table is empty, cannot infer columns.');

    // Check purchases (RLS restricted - should fail or return empty)
    console.log('\nTable: purchases');
    const { data: purch, error: purchErr } = await supabase.from('purchases').select('*').limit(1);
    if (purchErr) console.log('Note (expected if RLS):', purchErr.message);
    else console.log('Purchases check succeeded (maybe RLS is not enabled?)');

    // Check orders
    console.log('\nTable: orders');
    const { error: orderErr } = await supabase.from('orders').select('*').limit(1);
    if (orderErr) console.log('Note:', orderErr.message);
}

inspectSchema();
