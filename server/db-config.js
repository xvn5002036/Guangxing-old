import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(rootDir, 'database.config.json');

const normalizePath = (value) => {
    if (!value) return value;
    return path.isAbsolute(value) ? value : path.resolve(rootDir, value);
};

export const loadDatabaseConfig = () => {
    const defaults = {
        provider: 'sqlite',
        sqlite: { file: './data/guangxing.sqlite' },
        mysql: {
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: '',
            database: 'guangxing'
        },
        supabase: { url: '', serviceRoleKey: '' }
    };

    const fileConfig = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        : {};

    const merged = {
        ...defaults,
        ...fileConfig,
        sqlite: { ...defaults.sqlite, ...(fileConfig.sqlite || {}) },
        mysql: { ...defaults.mysql, ...(fileConfig.mysql || {}) },
        supabase: { ...defaults.supabase, ...(fileConfig.supabase || {}) }
    };

    merged.provider = (process.env.DB_PROVIDER || process.env.DATABASE_PROVIDER || merged.provider || 'sqlite').toLowerCase();
    merged.sqlite.file = normalizePath(process.env.SQLITE_FILE || merged.sqlite.file);

    merged.mysql.host = process.env.MYSQL_HOST || merged.mysql.host;
    merged.mysql.port = Number(process.env.MYSQL_PORT || merged.mysql.port);
    merged.mysql.user = process.env.MYSQL_USER || merged.mysql.user;
    merged.mysql.password = process.env.MYSQL_PASSWORD ?? merged.mysql.password;
    merged.mysql.database = process.env.MYSQL_DATABASE || merged.mysql.database;

    merged.supabase.url = process.env.SUPABASE_URL || merged.supabase.url;
    merged.supabase.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || merged.supabase.serviceRoleKey;

    return merged;
};
