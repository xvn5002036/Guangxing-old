import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmswwklptwtxceomjrbm.supabase.co';
const supabaseKey = 'sb_publishable_SbF7J4kDf6jA1-yOzrtX2w_C0WBVg1C'; // Anon key from config.ts

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking tables with Anon Key...');
    
    const tables = ['digital_products', 'orders', 'purchases'];
    
    // Test JOIN
    console.log('\nTesting Join Query (my-library)...');
    const { data: join, error: joinErr } = await supabase
        .from('purchases')
        .select(`
            id,
            created_at,
            digital_products!product_id (*)
        `)
        .limit(1);
    
    if (joinErr) console.log('Join ERROR:', joinErr.message, joinErr.code);
    else console.log('Join OK:', JSON.stringify(join, null, 2));
}

checkTables();
