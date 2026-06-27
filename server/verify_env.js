import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

console.log('--- Backend Environment Check ---');
console.log('Current Directory:', process.cwd());

const envPath = path.resolve(process.cwd(), '.env');
console.log('Checking for .env at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('SUCCESS: .env file found.');
    const result = dotenv.config();
    if (result.error) {
        console.error('ERROR: Failed to parse .env file:', result.error.message);
    } else {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        console.log('SUPABASE_URL:', url ? 'PRESENT' : 'MISSING');
        console.log('SUPABASE_SERVICE_ROLE_KEY:', key ? `PRESENT (Length: ${key.length})` : 'MISSING');
        
        if (key && !key.startsWith('eyJ')) {
            console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY does not look like a JWT (should start with eyJ). Please check if you copied the correct key.');
        }
    }
} else {
    console.error('ERROR: .env file NOT found in the current directory.');
}
