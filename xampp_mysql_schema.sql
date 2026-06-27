CREATE DATABASE IF NOT EXISTS guangxing
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE guangxing;

CREATE TABLE IF NOT EXISTS digital_products (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NULL,
  content LONGTEXT NULL,
  description TEXT NULL,
  category VARCHAR(120) NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  file_path TEXT NULL,
  preview_url TEXT NULL,
  file_type VARCHAR(50) DEFAULT 'HTML',
  attachments JSON NULL,
  tags JSON NULL,
  is_limited_time TINYINT(1) NOT NULL DEFAULT 0,
  promotion_end_date DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NULL,
  product_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('PENDING','PAID','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  merchant_trade_no VARCHAR(64) NOT NULL UNIQUE,
  payment_type VARCHAR(80) NULL,
  payment_date DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_product_id (product_id),
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES digital_products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS purchases (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NULL,
  product_id CHAR(36) NOT NULL,
  order_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_purchases_user_product (user_id, product_id),
  INDEX idx_purchases_user_id (user_id),
  INDEX idx_purchases_product_id (product_id),
  INDEX idx_purchases_order_id (order_id),
  CONSTRAINT fk_purchases_product FOREIGN KEY (product_id) REFERENCES digital_products(id) ON DELETE CASCADE,
  CONSTRAINT fk_purchases_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookmarks (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  progress JSON NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bookmarks_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notes (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  content TEXT NOT NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO digital_products (title, author, description, category, price, file_type, content, tags)
VALUES
('本地測試經書', '廣行宮', 'XAMPP MySQL 模式測試資料', '經書', 0, 'HTML', '<p>這是本地資料庫測試內容。</p>', JSON_ARRAY('local','xampp'))
ON DUPLICATE KEY UPDATE title = title;
