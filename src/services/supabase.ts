import { createClient } from '@supabase/supabase-js';

import { DATABASE_PROVIDER, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

if (DATABASE_PROVIDER === 'supabase' && (!supabaseUrl || !supabaseAnonKey)) {
    console.error('Missing Supabase environment variables');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

export const isSupabaseConfigured = () => DATABASE_PROVIDER === 'supabase' && !!supabaseUrl && !!supabaseAnonKey;
