-- =================================================================
-- CLEAR DATA SCRIPT (保留會員 Profiles 與 網站設定 Site Settings)
-- =================================================================
-- 警告：執行此指令將會清空所有「交易資料」與「內容資料」。
-- Warning: This script will DELETE all transaction and content data.

-- 1. 清空交易資料 (Transactions)
TRUNCATE TABLE
  public.registrations,  -- 報名資料
  public.orders,         -- 訂單資料
  public.purchases,      -- 購買紀錄
  public.bookmarks,      -- 我的收藏
  public.notes,          -- 個人筆記
  public.notifications   -- 通知訊息
  CASCADE;

-- 2. 清空內容資料 (Content)
-- 如果您想保留 服務/活動/最新消息 等內容，請將下方指令註解掉 (Add -- at start)
TRUNCATE TABLE
  public.services,       -- 服務項目
  public.events,         -- 活動花絮/行事曆
  public.news,           -- 最新消息
  public.gallery,        -- 相簿內容
  public.gallery_albums, -- 相簿分類
  public.digital_products, -- 結緣品/藏書
  public.faqs,           -- 常見問題
  public.org_members     -- 組織架構(執事人員)
  CASCADE;

-- 3. 保留資料 (Preserved)
-- public.profiles (會員資料) -> 不動作 (Kept)
-- public.site_settings (網站全域設定) -> 不動作 (Kept)

-- =================================================================
-- 完成。請在 Supabase SQL Editor 中執行此腳本。
-- Done. Run this script in Supabase SQL Editor.
