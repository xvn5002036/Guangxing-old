<div align="center">
  <img width="1200" height="400" alt="廣行宮數位轉型" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);" />
  
  # 新莊武壇廣行宮 | 數位宮廟管理系統
  
  **代天巡狩 · 威靈顯赫 | 融合傳統信仰與現代科技的全方位數位轉型解決方案**
  
  [![Build Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)](https://guangxing.vercel.app)
  [![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TS%20%7C%20Supabase-blue?style=for-the-badge)](https://react.dev/)
  [![AI](https://img.shields.io/badge/AI-Gemini%20Pro-green?style=for-the-badge)](https://deepmind.google/technologies/gemini/)
</div>

---

## 📖 專案概述

本專案旨在為「新莊武壇廣行宮」建立現代化的數位宮廟平台。不僅提供優雅的前台展示介面，更集成了完善的後台管理系統（CMS），讓宮廟管理者能輕鬆處理日常事務、線上報名及信眾互動，實現宮廟文化的數位傳承。

## ✨ 核心特色

### 🏟️ 前台沉浸式體驗
- **互動式視覺效果**：採用高效能的 Canvas 與 CSS 動畫，營造莊嚴神祕的氛圍。
- **AI 靈籤系統**：整合 Google Gemini AI，提供深度的籤詩解析與生活建議。
- **線上服務登記**：支援平安燈、光明燈、補財庫等各項服務的線上報名流程。
- **數位行事曆**：清晰展示宮廟慶典與法會活動。
- **響應式設計**：完美適配手機、平板與桌機。

### ⚙️ 後台管理系統 (CMS)
- **視覺化內容編輯**：直接在管理介面修改宮廟沿革、神尊介紹及網站基本設定。
- **報名資訊管理**：列印收據、狀態追蹤（已辦理/未辦理）及搜尋信眾記錄。
- **資料即時同步**：整合 Supabase Realtime，編輯內容後前端免重新整理即可更新。
- **組織與公告管理**：動態更新執事人員、最新消息與常見問題。

---

## 🛠️ 技術架構

| 領域 | 技術棧 |
| :--- | :--- |
| **前端框架** | React 19 + TypeScript |
| **建構工具** | Vite 6 |
| **樣式處理** | CSS3 (Custom Modules) + Tailwind CSS (Partial Utility) |
| **後端服務** | Supabase (Database, Auth, Storage, Realtime) |
| **人工智慧** | Google Gemini Generative AI SDK |
| **圖標庫** | Lucide React |

---

## 🚀 快速上手

### 1. 環境需求
- Node.js (v18+)
- NPM 或 Yarn

### 2. 安裝步驟
```bash
# 複製專案
git clone <your-repo-url>
cd Guangxing

# 安裝依賴
npm install

# 設定環境變數
# 請參考 .env.example 建立 .env.local 並填入適當的 API Key
cp .env.example .env.local
```

### 3. 開發環境執行
```bash
npm run dev
```

---

## ☁️ 部署說明

本專案針對 **Vercel** 進行了優化：

1. 將程式碼推送到 GitHub。
2. 在 Vercel 建立新專案並連結 GitHub 儲存庫。
3. **重要：** 在 Vercel 設定中加入以下環境變數：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
4. 部署完成後，即可享用完整功能。

---

## 🗄️ 資料庫架構

資料庫採用 Supabase (PostgreSQL)。若需初始化或遷移資料庫，請參考根目錄下的 `supabase_schema.sql` 檔案。

```sql
-- 主要資料表包括：
-- profiles: 會員資料與權限管理
-- news: 最新消息公告
-- events: 活動行事曆
-- registrations: 線上報名記錄
-- site_settings: 網站全網配置
```

---

## 👨‍💻 維護與貢獻

如需增加新功能或回報問題，請聯繫系統管理員或提交 Pull Request。

<div align="center">
  <p>© 2026 新莊武壇廣行宮. Built with ❤️ and Faith.</p>
</div>
