PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  birth_year TEXT,
  birth_month TEXT,
  birth_day TEXT,
  birth_hour TEXT,
  city TEXT,
  district TEXT,
  address TEXT,
  gender TEXT DEFAULT 'M',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS digital_products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  content TEXT,
  description TEXT,
  category TEXT,
  price REAL NOT NULL DEFAULT 0,
  file_path TEXT,
  preview_url TEXT,
  file_type TEXT DEFAULT 'HTML',
  attachments TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  is_limited_time INTEGER NOT NULL DEFAULT 0,
  promotion_end_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  product_id TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','FAILED','CANCELLED')),
  merchant_trade_no TEXT NOT NULL UNIQUE,
  payment_type TEXT,
  payment_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES digital_products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  product_id TEXT NOT NULL,
  order_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, product_id),
  FOREIGN KEY (product_id) REFERENCES digital_products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  progress TEXT DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  temple_name TEXT,
  address TEXT,
  phone TEXT,
  line_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image TEXT,
  deity_image TEXT,
  deity_title TEXT,
  deity_intro TEXT,
  deity_birthday TEXT,
  deity_birthday_label TEXT,
  deity_duty TEXT,
  deity_duty_label TEXT,
  history_image_roof TEXT,
  history_roof_title TEXT,
  history_roof_desc TEXT,
  history_image_stone TEXT,
  history_stone_title TEXT,
  history_stone_desc TEXT,
  history_title1 TEXT,
  history_desc1 TEXT,
  history_title2 TEXT,
  history_desc2 TEXT,
  history_title3 TEXT,
  history_desc3 TEXT,
  config_donation TEXT DEFAULT '{}',
  config_light TEXT DEFAULT '{}',
  config_event TEXT DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  date TEXT,
  title TEXT NOT NULL,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  end_date TEXT,
  lunar_date TEXT,
  lunar_end_date TEXT,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT,
  type TEXT NOT NULL DEFAULT 'FESTIVAL',
  field_config TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  price REAL NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'RITUAL',
  light_duration_days INTEGER,
  field_config TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  service_id TEXT,
  service_title TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  birth_year TEXT,
  birth_month TEXT,
  birth_day TEXT,
  birth_hour TEXT,
  city TEXT,
  district TEXT,
  road TEXT,
  address_detail TEXT,
  gender TEXT,
  amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PAID',
  is_processed INTEGER NOT NULL DEFAULT 0,
  light_start_date TEXT,
  light_expire_date TEXT,
  light_duration_days INTEGER,
  payment_method TEXT,
  payment_details TEXT,
  bank_last_five TEXT,
  id_number TEXT,
  user_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS org_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  image TEXT,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery_albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  event_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'IMAGE',
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  album_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_gallery_album_id ON gallery(album_id);
CREATE INDEX IF NOT EXISTS idx_registrations_service_id ON registrations(service_id);
CREATE INDEX IF NOT EXISTS idx_registrations_light_expire_date ON registrations(light_expire_date);

DELETE FROM digital_products WHERE id = 'local-demo-product' OR title = '本地測試經書';
DELETE FROM profiles WHERE email LIKE 'test%@example.com';

INSERT OR IGNORE INTO site_settings
(id, temple_name, address, phone, line_url, hero_title, hero_subtitle, hero_image, deity_image, deity_title, deity_intro,
 deity_birthday, deity_birthday_label, deity_duty, deity_duty_label, history_image_roof, history_roof_title, history_roof_desc,
 history_image_stone, history_stone_title, history_stone_desc, history_title1, history_desc1, history_title2, history_desc2,
 history_title3, history_desc3, config_donation, config_light, config_event)
VALUES
('default', '新莊武壇廣行宮', '242新北市新莊區福營路500號', '(02) 2345-6789', 'https://line.me/ti/p/@temple_demo',
 '代天巡狩', '威靈顯赫 · 廣行濟世',
 'https://images.unsplash.com/photo-1592388796690-3482d8d8091e?q=80&w=2600&auto=format&fit=crop',
 'https://images.unsplash.com/photo-1616401776943-41c0f04df518?q=80&w=2000&auto=format&fit=crop',
 '傳奇緣起', '請在後台「一般設定」修改主神介紹。',
 '農曆六月十八', '聖誕千秋', '消災 · 解厄', '專司職責',
 'https://images.unsplash.com/photo-1542649761-0af3759b9e6f?q=80&w=1000&auto=format&fit=crop',
 '燕尾脊', '請在後台修改建築特色說明。',
 'https://images.unsplash.com/photo-1596545753969-583d73b3eb38?q=80&w=1000&auto=format&fit=crop',
 '龍柱石雕', '請在後台修改建築特色說明。',
 '草創時期', '請在後台修改沿革第一段。',
 '建廟大業', '請在後台修改沿革第二段。',
 '現代弘法', '請在後台修改沿革第三段。',
 '{"showBirth":false,"showTime":false,"showAddress":false,"showIdNumber":false}',
 '{"showBirth":true,"showTime":true,"showAddress":true,"showIdNumber":false}',
 '{"showBirth":true,"showTime":false,"showAddress":true,"showIdNumber":true}');

INSERT OR IGNORE INTO news (id, date, title, category) VALUES
('sample-news-2026-open', '2026-06-26', '範例公告：新莊式壇廟行宮網站測試上線', '公告');

INSERT OR IGNORE INTO events (id, date, lunar_date, title, description, time, type, field_config) VALUES
('sample-event-2026-pray', '2026-07-15', '農曆六月初二', '範例法會：平安祈福法會', '供後台測試用，可自行修改或刪除。', '09:00-12:00', 'RITUAL', '{"showBirth":true,"showTime":true,"showAddress":true,"showIdNumber":false}');

INSERT OR IGNORE INTO services (id, title, description, icon_name, price, type, light_duration_days, field_config) VALUES
('sample-service-light', '範例服務：點燈祈福', '供後台測試用的服務項目，可調整價格、欄位與說明。', 'Flame', 600, 'LIGHT', 30, '{"showBirth":true,"showTime":true,"showAddress":false,"showIdNumber":false}');
UPDATE services SET type = 'LIGHT', light_duration_days = COALESCE(light_duration_days, 30) WHERE id = 'sample-service-light';

INSERT OR IGNORE INTO org_members (id, name, title, image, category, sort_order) VALUES
('sample-org-master', '範例宮主', '宮主', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop', 'LEADER', 1),
('sample-org-volunteer', '範例志工', '服務志工', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop', 'STAFF', 2);

INSERT OR IGNORE INTO faqs (id, question, answer) VALUES
('sample-faq-register', '範例問題：如何報名活動？', '請從前台活動頁或後台建立的服務項目進入報名流程。');

INSERT OR IGNORE INTO digital_products
(id, title, author, content, description, category, price, file_type, tags)
VALUES
('sample-scripture-2026', '範例道藏藏書：祈福疏文', '新莊式壇廟行宮', '<h1>祈福疏文範例</h1><p>這是供測試用的範例內容，可在後台修改。</p>', '供會員購買流程與藏書顯示測試使用。', '疏文範例', 100, 'HTML', '["範例","測試"]');

INSERT OR IGNORE INTO gallery_albums (id, title, description, cover_image_url, event_date) VALUES
('sample-album-local', '範例相簿：本機與外部連結測試', '可測試本機上傳、YouTube、Google 相簿、FB、IG、Threads、TikTok、Apple 相簿等公開連結。', 'https://images.unsplash.com/photo-1592388796690-3482d8d8091e?q=80&w=1200&auto=format&fit=crop', '2026-06-26');

INSERT OR IGNORE INTO gallery (id, type, url, title, album_id) VALUES
('sample-gallery-image', 'IMAGE', 'https://images.unsplash.com/photo-1592388796690-3482d8d8091e?q=80&w=1200&auto=format&fit=crop', '範例圖片：公開圖片連結', 'sample-album-local'),
('sample-gallery-youtube', 'YOUTUBE', 'https://www.youtube.com/watch?v=jfKfPfyJRdk', '範例影片：YouTube 連結', 'sample-album-local'),
('sample-gallery-social', 'IMAGE', 'https://www.instagram.com/', '範例外部連結：IG/FB/Threads/TikTok/相簿可改成你的公開網址', 'sample-album-local');
