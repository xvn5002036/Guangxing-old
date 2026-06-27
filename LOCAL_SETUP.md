# Local Setup

This project can run without Vercel. The local Node server serves both:

- the Express API under `/api/*`
- the built Vite frontend from `dist/`

## Install

```bash
npm install
```

## Supabase Mode

Create `.env.local` from `.env.example` and set:

```env
VITE_DATABASE_PROVIDER=supabase
DB_PROVIDER=supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=80
PUBLIC_BASE_URL=http://localhost
FRONTEND_BASE_URL=http://localhost
```

Then run:

```bash
npm run dev:all
```

Open `http://localhost` for Vite development. API requests are proxied to `http://localhost`.

For one local production-like server:

```bash
npm run start:local
```

Open `http://localhost`.

## XAMPP / MySQL Mode

1. Start Apache and MySQL in XAMPP.
2. Open phpMyAdmin.
3. Import `xampp_mysql_schema.sql`.
4. Create `.env.local`:

```env
VITE_DATABASE_PROVIDER=mysql
DB_PROVIDER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=guangxing
PORT=80
PUBLIC_BASE_URL=http://localhost
FRONTEND_BASE_URL=http://localhost
```

Then run:

```bash
npm run start:local
```

Open `http://localhost`.

## Diagnostics

Check the active database provider and table connectivity:

```bash
curl http://localhost/api/diag
```

## Current MySQL Coverage

The local MySQL adapter supports the digital product/shop flow through:

- `GET /api/products`
- `POST /api/manual-order`
- `POST /api/create-order`
- `POST /api/webhook/ecpay`
- `GET /api/my-library`
- `DELETE /api/products/:id`
- `GET /api/download/:productId`

Supabase-only features such as Supabase Auth, Realtime subscriptions, Storage uploads, admin profile management, bookmarks, and notes still use Supabase APIs unless they are later migrated to Express API routes.

## One-File Database Switch

Database selection is controlled by:

```text
database.config.json
```

Change only `provider` to switch the server database adapter:

```json
{
  "provider": "sqlite"
}
```

Supported values:

- `sqlite`
- `mysql`
- `supabase`

SQLite database file location is controlled here:

```json
{
  "sqlite": {
    "file": "./data/guangxing.sqlite"
  }
}
```

## SQLite Test Mode

SQLite is the default test database. Initialize it with either:

```bash
npm run db:tool
```

or double-click:

```text
database-tool.bat
```

Choose:

```text
2) Initialize SQLite database + admin account
```

The default SQLite admin account is:

```text
Email: xvn5002036@gmail.com
Password: 112221
```

The password is stored as a bcrypt hash in SQLite, not as plain text.

## SQL Conversion Menu

Run:

```bash
npm run db:tool
```

or open:

```text
database-tool.bat
```

Choose:

```text
3) Convert SQL
```

Non-interactive examples:

```bash
node tools/db-tool.cjs set-provider sqlite ./data/guangxing.sqlite
node tools/db-tool.cjs init-sqlite
node tools/db-tool.cjs convert sqlite-to-mysql sqlite_schema.sql converted_mysql.sql
node tools/db-tool.cjs convert mysql-to-sqlite xampp_mysql_schema.sql converted_sqlite.sql
node tools/db-tool.cjs convert supabase-to-sqlite supabase_schema.sql converted_sqlite.sql
```

Available conversions:

- SQLite schema -> MySQL SQL
- MySQL SQL -> SQLite SQL
- Supabase/PostgreSQL SQL -> SQLite starter SQL

The converter is designed for this project schema and starter migrations. For a production migration with real data, export table data separately and verify constraints/indexes after import.
