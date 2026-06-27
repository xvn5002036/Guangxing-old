# 新莊武壇廣行宮網站系統

這是一套給宮廟使用的前台網站與後台管理系統。前台提供公告、行事曆、服務項目、線上點燈、活動花絮、數位商城、會員中心與八字命盤；後台可管理網站內容、會員、報名訂單、藏書訂單與各項設定。

目前專案以本機 SQLite 資料庫為主，資料庫檔案在 `data/guangxing.sqlite`，已納入專案版本管理，方便整包備份與上傳。

## 快速啟動

最簡單的方式：

```bat
開啟網站.bat
```

執行後會自動啟動前台與後台 API，瀏覽器請開：

```text
http://localhost
```

如果要手動啟動：

```bash
npm install
npm run dev:all
```

## 常用指令

```bash
npm run dev
```

只啟動前台 Vite。

```bash
npm run dev:server
```

只啟動後端 API。

```bash
npm run dev:all
```

同時啟動前台與後端。

```bash
npm run build
```

打包正式版網站。

```bash
npx tsc --noEmit
```

檢查 TypeScript 是否有錯。

```bash
npm run db:tool
```

開啟資料庫設定工具，可選擇 SQLite、MySQL 或 Supabase。

## 專案架構

```text
src/                 前台與後台 React 程式
server/              Express API 與資料庫讀寫
data/                SQLite 資料庫
uploads/             本機上傳檔案
tools/               資料庫工具
public/              靜態資源
dist/                打包後輸出
開啟網站.bat          Windows 一鍵開站檔案
```

## 前台架構

前台目前採用上、中、下三段式：

- 上方：固定導覽列與跑馬燈公告
- 中央：依照上方導覽載入不同頁面
- 下方：頁尾資訊

上方導覽不再使用單頁錨點跳轉，而是切換中央內容頁面，畫面較乾淨，也避免跑馬燈公告位置被影響。

主要前台頁面：

- 首頁
- 最新公告
- 行事曆
- 濟世服務
- 線上點燈
- 宮廟沿革
- 活動花絮
- 數位商城
- 交通指引
- 會員中心

## 後台功能

後台可管理：

- 一般設定
- 最新消息
- 行事曆管理
- 服務項目
- 活動花絮
- 常見問題
- 跑馬燈公告
- 報名管理
- 道藏藏書管理
- 道藏收藏訂單
- 會員管理

資料原則：

- 前台內容優先讀取資料庫。
- 不使用寫死範例作為主要顯示資料。
- 後台一般設定會提供初始範例，方便第一次修改。
- 測試資料應刪除，不應混入正式內容。

## 資料庫

目前主要使用：

```text
data/guangxing.sqlite
```

相關檔案：

```text
sqlite_schema.sql
supabase_schema.sql
xampp_mysql_schema.sql
database.config.json
```

注意：

- SQLite 是目前本機優先使用的資料庫。
- `data/guangxing.sqlite` 已加入 Git，可連同網站一起備份或上傳。
- 如果改用 MySQL 或 Supabase，請先使用 `npm run db:tool` 設定。

## 會員中心

會員中心包含：

- 個人資料
- 祈福紀錄
- 我的經文庫
- 線上安太歲
- 我的八字命盤

八字命盤使用 `@openfate/bazi-mcp` 產生命盤資料，並顯示：

- 四柱命盤
- 天干地支
- 十神
- 地支藏干
- 納音
- 十二長生
- 空亡
- 格局判讀
- 五行能量
- 十神佔比與解釋
- 大運
- 命盤互動

## 上傳檔案

活動花絮與圖片可使用本機或外部網址。

支援概念：

- 本機上傳圖片
- Facebook、Instagram、YouTube、Google 相簿等外部連結
- 其他可公開讀取的圖片或影片網址

後台不再使用 GitHub 作為相簿設定方式。

## 開發確認流程

修改程式後建議依序執行：

```bash
npx tsc --noEmit
npm run build
```

兩個都通過後，再重新啟動：

```bash
npm run dev:all
```

## Git 與備份

上傳前可檢查目前變更：

```bash
git status
```

提交：

```bash
git add .
git commit -m "更新網站內容"
git push
```

本專案包含資料庫檔案，因此上傳時會包含：

- 網站程式
- 後台程式
- 本機 SQLite 資料庫
- 設定檔
- 上傳資料夾內已加入版本管理的檔案

## 環境需求

- Windows
- Node.js 18 以上
- npm

建議使用 Chrome 開啟：

```text
http://localhost
```

## 備註

如果網站開不起來，先確認：

1. 是否已執行 `npm install`
2. 是否已啟動 `npm run dev:all`
3. `data/guangxing.sqlite` 是否存在
4. 瀏覽器是否開啟 `http://localhost`

如果後台資料沒有出現，通常要先檢查資料庫連線與 `database.config.json`。
