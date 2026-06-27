const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'database.config.json');
const sqliteSchemaPath = path.join(root, 'sqlite_schema.sql');
const mysqlSchemaPath = path.join(root, 'xampp_mysql_schema.sql');

const readConfig = () => JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const writeConfig = (config) => fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
const abs = (value) => path.isAbsolute(value) ? value : path.resolve(root, value);
const providerChoices = {
  1: 'sqlite',
  2: 'mysql',
  3: 'supabase',
  sqlite: 'sqlite',
  mysql: 'mysql',
  supabase: 'supabase',
};
const resolveProvider = (value) => providerChoices[String(value || '').trim().toLowerCase()];
const detectSqliteFile = (config) => abs(config.sqlite?.file || path.join('data', 'guangxing.sqlite'));
const ensureSqliteColumn = (db, table, column, definition) => {
  const tableExists = db.prepare("select name from sqlite_master where type = 'table' and name = ?").get(table);
  if (!tableExists) return;
  const columns = db.prepare(`pragma table_info(${table})`).all().map((row) => row.name);
  if (!columns.includes(column)) db.prepare(`alter table ${table} add column ${column} ${definition}`).run();
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

const setProvider = async () => {
  const config = readConfig();
  console.log('\n請選擇資料庫類型');
  console.log('1) SQLite（本機檔案，最簡單）');
  console.log('2) MySQL（XAMPP / MySQL）');
  console.log('3) Supabase（雲端資料庫）');
  const provider = resolveProvider(await ask('請輸入 1、2 或 3: '));
  if (!provider) throw new Error('不支援的資料庫類型，請輸入 1、2 或 3。');
  config.provider = provider;

  if (provider === 'sqlite') {
    config.sqlite = config.sqlite || {};
    config.sqlite.file = config.sqlite.file || '.\\data\\guangxing.sqlite';
    console.log(`SQLite 檔案會自動使用：${detectSqliteFile(config)}`);
  }

  writeConfig(config);
  console.log(`已更新 database.config.json，資料庫類型=${provider}`);
};

const initSqlite = () => {
  const config = readConfig();
  config.sqlite = config.sqlite || {};
  config.sqlite.file = config.sqlite.file || '.\\data\\guangxing.sqlite';
  const sqliteFile = detectSqliteFile(config);
  writeConfig(config);
  fs.mkdirSync(path.dirname(sqliteFile), { recursive: true });
  const db = new Database(sqliteFile);
  db.pragma('foreign_keys = ON');
  ensureSqliteColumn(db, 'services', 'light_duration_days', 'INTEGER');
  ensureSqliteColumn(db, 'registrations', 'light_start_date', 'TEXT');
  ensureSqliteColumn(db, 'registrations', 'light_expire_date', 'TEXT');
  ensureSqliteColumn(db, 'registrations', 'light_duration_days', 'INTEGER');
  db.exec(fs.readFileSync(sqliteSchemaPath, 'utf-8'));

  const email = 'xvn5002036@gmail.com';
  const passwordHash = bcrypt.hashSync('112221', 12);
  const existing = db.prepare('select id from profiles where email = ?').get(email);
  if (existing) {
    db.prepare("update profiles set role = 'admin', password_hash = ?, updated_at = current_timestamp where email = ?")
      .run(passwordHash, email);
  } else {
    db.prepare("insert into profiles (id, email, full_name, role, password_hash) values (?, ?, ?, 'admin', ?)")
      .run(crypto.randomUUID(), email, '系統管理員', passwordHash);
  }

  console.log(`SQLite 已初始化：${sqliteFile}`);
  console.log('管理員帳號已建立/更新：xvn5002036@gmail.com');
};

const sqliteToMysql = (sql) => sql
  .replace(/PRAGMA foreign_keys = ON;/gi, '')
  .replace(/TEXT PRIMARY KEY/g, 'CHAR(36) NOT NULL PRIMARY KEY')
  .replace(/INTEGER NOT NULL DEFAULT 0/g, 'TINYINT(1) NOT NULL DEFAULT 0')
  .replace(/REAL NOT NULL DEFAULT 0/g, 'DECIMAL(10,2) NOT NULL DEFAULT 0')
  .replace(/TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP')
  .replace(/TEXT DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
  .replace(/CREATE TABLE IF NOT EXISTS ([^(]+)\s*\(/g, 'CREATE TABLE IF NOT EXISTS $1 (')
  .replace(/\);\n\nCREATE/g, ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nCREATE');

const mysqlToSqlite = (sql) => sql
  .replace(/CREATE DATABASE[\s\S]*?;\s*/gi, '')
  .replace(/USE\s+[^;]+;\s*/gi, '')
  .replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci/gi, '')
  .replace(/CHAR\(36\) NOT NULL PRIMARY KEY DEFAULT \(UUID\(\)\)/gi, 'TEXT PRIMARY KEY')
  .replace(/CHAR\(36\) NOT NULL PRIMARY KEY/gi, 'TEXT PRIMARY KEY')
  .replace(/CHAR\(36\)/gi, 'TEXT')
  .replace(/VARCHAR\(\d+\)/gi, 'TEXT')
  .replace(/LONGTEXT/gi, 'TEXT')
  .replace(/DECIMAL\(\d+,\d+\)/gi, 'REAL')
  .replace(/DATETIME/gi, 'TEXT')
  .replace(/TINYINT\(1\)/gi, 'INTEGER')
  .replace(/JSON/gi, 'TEXT')
  .replace(/ENUM\([^)]+\)/gi, 'TEXT')
  .replace(/UNIQUE KEY\s+\w+\s+\(([^)]+)\)/gi, 'UNIQUE ($1)')
  .replace(/INDEX\s+\w+\s+\([^)]+\),?/gi, '')
  .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '');

const convertSql = async () => {
  console.log('\n1) SQLite 結構檔 -> MySQL SQL');
  console.log('2) MySQL SQL -> SQLite SQL');
  console.log('3) Supabase/PostgreSQL SQL -> SQLite 起始 SQL');
  const mode = (await ask('請選擇轉換方式: ')).trim();
  const inputDefault = mode === '1' ? sqliteSchemaPath : mode === '2' ? mysqlSchemaPath : path.join(root, 'supabase_schema.sql');
  const input = (await ask(`輸入 SQL 檔案 [${inputDefault}]: `)).trim() || inputDefault;
  const output = (await ask('輸出 SQL 檔案路徑: ')).trim();
  if (!output) throw new Error('必須填寫輸出檔案路徑。');

  const sql = fs.readFileSync(abs(input), 'utf-8');
  let converted;
  if (mode === '1') converted = sqliteToMysql(sql);
  else if (mode === '2') converted = mysqlToSqlite(sql);
  else if (mode === '3') converted = fs.readFileSync(sqliteSchemaPath, 'utf-8');
  else throw new Error('未知的轉換方式。');

  fs.writeFileSync(abs(output), converted, 'utf-8');
  console.log(`已寫入轉換後的 SQL：${abs(output)}`);
};

const main = async () => {
  try {
    const [, , command, ...args] = process.argv;
    if (command === 'init-sqlite') {
      initSqlite();
      return;
    }
    if (command === 'set-provider') {
      const provider = resolveProvider(args[0]);
      if (!provider) throw new Error('用法：node tools/db-tool.cjs set-provider 1|2|3，也可用 sqlite|mysql|supabase');
      const config = readConfig();
      config.provider = provider;
      if (provider === 'sqlite' && args[1]) config.sqlite.file = args[1];
      writeConfig(config);
      console.log(`已更新 database.config.json，資料庫類型=${provider}`);
      return;
    }
    if (command === 'convert') {
      const [mode, input, output] = args;
      if (!mode || !output) throw new Error('用法：node tools/db-tool.cjs convert sqlite-to-mysql|mysql-to-sqlite|supabase-to-sqlite input.sql output.sql');
      const source = input === '-' ? '' : fs.readFileSync(abs(input), 'utf-8');
      let converted;
      if (mode === 'sqlite-to-mysql') converted = sqliteToMysql(source);
      else if (mode === 'mysql-to-sqlite') converted = mysqlToSqlite(source);
      else if (mode === 'supabase-to-sqlite') converted = fs.readFileSync(sqliteSchemaPath, 'utf-8');
      else throw new Error('未知的轉換方式。');
      fs.writeFileSync(abs(output), converted, 'utf-8');
      console.log(`已寫入轉換後的 SQL：${abs(output)}`);
      return;
    }

    console.log('\n廣興資料庫工具');
    console.log('1) 切換資料庫類型/位置');
    console.log('2) 初始化 SQLite 資料庫 + 管理員帳號');
    console.log('3) 轉換 SQL 檔案');
    console.log('4) 顯示目前設定');
    console.log('0) 離開');
    const choice = (await ask('請選擇: ')).trim();
    if (choice === '1') await setProvider();
    else if (choice === '2') initSqlite();
    else if (choice === '3') await convertSql();
    else if (choice === '4') console.log(JSON.stringify(readConfig(), null, 2));
  } finally {
    rl.close();
  }
};

main().catch((error) => {
  console.error(error.message);
  rl.close();
  process.exit(1);
});
