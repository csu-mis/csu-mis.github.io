# 正修科技大學資訊管理系系學會 官方網站

第 25 屆系學會官網。Astro 靜態網站，內容以 Markdown 與 JSON 管理，推上 GitHub 後自動部署。

網址：<https://csu-mis.github.io>

---

## 給接手的人：我要改東西，該動哪個檔案？

**你幾乎不需要碰程式碼。** 常見的更新都對應到一個資料檔：

| 我想改… | 改這個檔案 |
| --- | --- |
| 發布一則新公告 | 在 `src/content/announcements/` 新增一個 `.md` 檔（見下方教學） |
| 幹部名單、職稱、簡介、照片 | `src/data/officers/<屆數>.json`（一屆一個檔，見下方教學） |
| 組別名稱與職掌 | `src/data/departments.json` |
| 系學會名稱、屆數、Email、辦公室、社群連結 | `src/data/site.json` |
| 首頁的「我們在做什麼」四張卡 | `src/data/home.json` |
| 關於頁的使命、沿革、常見問題 | `src/data/about.json` |
| 網頁上的按鈕文字、標題、提示語 | `src/i18n/zh-TW.json` |
| 顏色、字體、間距 | `src/styles/global.css` 最上方的「設計權杖」區塊 |
| 網站 logo | 換掉 `public/logo.png`（同時換 `favicon.png`、`apple-touch-icon.png`）|

> 改完存檔 → `git commit` → `git push`，約 1–2 分鐘後網站就會更新。

---

## 怎麼發布一則公告

### 1. 新增檔案

在 `src/content/announcements/` 裡新增一個 `.md` 檔。**檔名就是網址**，建議用「日期-英文短標題」：

```
src/content/announcements/2026-10-05-winter-camp.md
   ↓
https://csu-mis.github.io/announcements/2026-10-05-winter-camp
```

### 2. 檔案開頭寫 frontmatter

最上面用兩行 `---` 夾住的區塊是「這則公告的設定」，**每個欄位都會被檢查，寫錯會在部署時直接報錯，不會默默上線**：

```markdown
---
title: 2026 冬季營隊報名開始
date: 2026-10-05
category: 活動
summary: 一句話說明這則公告在講什麼，會顯示在列表卡片上，最多 160 字。
author: 活動部
tags: [營隊, 報名]
pinned: false
draft: false
---

這裡開始寫正文，用一般的 Markdown 語法就好。
```

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `title` | ✅ | 公告標題 |
| `date` | ✅ | 發布日期，格式 `YYYY-MM-DD` |
| `category` | ✅ | 只能填這五個之一：`活動`、`課務`、`招募`、`公告`、`資源` |
| `summary` | ✅ | 摘要，顯示在列表卡片與搜尋結果，上限 160 字 |
| `author` | | 發布單位，不填預設為「資管系學會」 |
| `tags` | | 標籤陣列，例如 `[迎新, 大一]`，不填就沒有 |
| `pinned` | | `true` 會置頂到列表最前面，預設 `false` |
| `draft` | | `true` 表示草稿，**正式網站不會顯示**，但本機預覽看得到 |
| `updated` | | 修訂日期，填了會在內頁顯示「更新於」 |
| `cover` | | 封面圖路徑，例如 `/images/camp.jpg`（圖片放 `public/images/`） |

### 3. 正文可以用的 Markdown

標題、粗體、清單、表格、引言、程式碼、連結、圖片都支援：

```markdown
## 這是大標題（會自動生成目錄）

### 這是小標題

一般段落。**粗體**、*斜體*、[連結](https://example.com)。

- 項目一
- 項目二

1. 第一步
2. 第二步

> 這是引言，會用金色底線標示，適合放注意事項。

| 項目 | 內容 |
| --- | --- |
| 日期 | 10 月 18 日 |
| 地點 | 澄清湖 |

![圖片說明](/images/camp.jpg)
```

> **小技巧**：正文裡放 3 個以上的 `##` 標題，內頁會自動生成一個目錄區塊。

### 4. 放圖片

圖片放到 `public/images/` 資料夾，在 Markdown 裡用 `/images/檔名` 引用（不用寫 `public`）。

---

## 怎麼新增一屆幹部名單

幹部名單**一屆一個檔案**，放在 `src/data/officers/`，檔名就是屆數，也就是網址：

```
src/data/officers/24.json   →   https://csu-mis.github.io/officers/24
```

現任那一屆固定顯示在 `/officers`，不會另外產生 `/officers/25`（避免同一份名單有兩個網址）。
其餘各屆會自動出現在幹部頁上方的「屆數」切換列，以及頁尾的上一屆／下一屆。

### 補上以前的屆數

複製一個現成的檔案改內容即可，程式不用動：

```jsonc
{
  "term": 24,                    // 屆數，要跟檔名一致
  "years": "2025–2026",          // 任期年份，顯示在切換列上（可留空字串）
  "summary": "",                 // 該屆的一句話介紹，顯示在名單上方（可留空字串）

  // 選填：只有當那一屆的組別跟 departments.json 不同時才要寫，
  // 陣列順序就是顯示順序；沒寫到的組別會被歸到「其他」。
  "departments": ["核心幹部", "行政組", "財務組"],

  "members": [
    {
      "id": "president",         // 同一個檔案裡不能重複，取英文短名即可
      "name": "江承翰",
      "role": "會長",             // 顯示在姓名下方，例如 會長／副公關／器機
      "department": "核心幹部",   // 對應 departments.json 的組別名稱
      "grade": "資管四甲",        // 班級，可留空字串
      "instagram": "csumis_sa",  // 填帳號或完整網址都可以，留空就不顯示
      "email": "",               // Gravatar 用，不會顯示在頁面上，見下方
      "photo": "",               // 頭貼，見下方；留空會用姓名末字當頭像
      "order": 1,                // 同組別內的排序，小的在前
      "intern": false            // 實習／觀察幹部設為 true，卡片會標「實習」
    }
  ]
}
```

欄位打錯或少寫，`pnpm build` 會直接報錯並指出是哪個檔案，不會默默上線。

> **學號不放進網站。** 學號屬個資，且本專案原始碼公開在 GitHub，
> 因此 Notion 上的學號欄不會同步過來，網站也不顯示。

### 放頭貼

圖片放到 `public/images/officers/<屆數>/`，在 JSON 的 `photo` 填 `/images/officers/25/president.jpg`。

- 建議正方形、至少 200×200，會被裁成圓形
- 檔名用英文，跟 `id` 一致最好認

### 用 Gravatar 當頭貼

沒有放本機圖片時，可以改在 `email` 欄位填該幹部**註冊 Gravatar 用的信箱**，
網站會在 build 時算出雜湊（SHA-256）產生頭貼網址，前端不需要任何 JS：

```
https://gravatar.com/avatar/<雜湊>?s=128&d=mp
```

- **信箱不會顯示在頁面上**，只用來產生頭貼網址；卡片上的聯絡方式是 Instagram
- 該信箱**沒有註冊過 Gravatar** 時，會顯示 Gravatar 提供的灰色人形剪影（`d=mp`）
- 不想把明碼信箱放進公開 repo 的話，`email` 也可以直接填該信箱的 SHA-256 雜湊：
  `node -e "console.log(require('crypto').createHash('sha256').update('someone@example.com'.trim().toLowerCase()).digest('hex'))"`

**頭貼的優先順序**：`photo`（本機圖片）→ `email`（Gravatar）→ 姓名末字的文字頭像。
本機圖片不受第三方影響、也不會讓訪客的瀏覽器連到 gravatar.com，仍然是首選。

### 換屆的時候

1. 新增 `src/data/officers/26.json`，把新一屆的名單填進去。
2. 把 `src/data/site.json` 的 `term` 改成 `26`、`termLabel` 改成 `"第 26 屆"`。

做完這兩步，新一屆自動變成 `/officers`，第 25 屆自動變成歷屆頁 `/officers/25`，
切換列與上下屆導覽也會跟著更新。**如果 `term` 改了卻沒建對應檔案，build 會直接失敗**，
提醒你補檔案，不會讓網站繼續顯示舊名單。

---

## 本機預覽

需要先安裝 [Node.js](https://nodejs.org)（建議 22 以上）與 [pnpm](https://pnpm.io)。

```bash
pnpm install     # 第一次才需要
pnpm dev         # 啟動預覽，打開 http://localhost:4321
```

其他指令：

```bash
pnpm build       # 產生正式檔案到 dist/
pnpm preview     # 預覽 build 出來的結果
pnpm check       # 檢查型別與公告格式有沒有寫錯
```

---

## 部署

推到 `main` 分支就會自動部署，設定在 `.github/workflows/deploy.yml`。

本專案是組織站台（repo 名稱即 `csu-mis.github.io`），部署後網址為 <https://csu-mis.github.io>，位於根路徑，不需要子路徑設定。

**第一次設定 GitHub Pages：**

1. GitHub 專案 → **Settings** → **Pages**
2. **Source** 選 **GitHub Actions**

> GitHub Pages 在免費方案的組織底下只支援公開 repo。repo 還是私有的話，
> Actions 的 build 會過、deploy 步驟會失敗，改為公開後即可正常部署。

**要改用自訂網域時**（例如 `csumis-sa.example.tw`）：

1. 新增 `public/CNAME`，內容寫該網域
2. 改 `astro.config.mjs` 的 `site`、`src/data/site.json` 的 `url`、`public/robots.txt` 的 Sitemap 網址
3. Settings → Pages → **Custom domain** 填入網域並勾選 **Enforce HTTPS**
4. 在網域的 DNS 加一筆 `CNAME` 記錄指向 `csu-mis.github.io`

---

## 專案結構

```
src/
├─ content/announcements/   ← 公告 Markdown（你最常動的地方）
├─ data/                    ← 站台資料：幹部、部門、首頁、關於、站台設定
├─ i18n/                    ← 介面文字。目前只有 zh-TW，未來要加英文版時複製一份即可
├─ styles/
│  ├─ global.css            ← 設計權杖（顏色/字體/間距）、重置、共用工具類
│  ├─ components.css        ← 頁首、頁尾、卡片、篩選列等元件樣式
│  └─ pages.css             ← 各頁面專屬樣式
├─ components/              ← 頁首、頁尾、卡片、圖示等元件
├─ layouts/BaseLayout.astro ← 所有頁面共用的外框（含 SEO meta）
├─ lib/                     ← 資料存取與排序邏輯
├─ content.config.ts        ← 公告與幹部的格式規則（schema）
└─ pages/                   ← 網址對應的頁面
   ├─ index.astro                       → /
   ├─ announcements/index.astro         → /announcements
   ├─ announcements/[...id].astro       → /announcements/公告檔名
   ├─ announcements/category/[category] → /announcements/category/events 等
   ├─ officers.astro                    → /officers（現任那一屆）
   ├─ officers/[term].astro             → /officers/24 等歷屆頁
   ├─ about.astro                       → /about
   ├─ 404.astro                         → 找不到頁面時
   └─ rss.xml.ts                        → /rss.xml
```

## 設計系統

視覺規範（配色、字體、間距、動態）記錄在 `design-system/csu-mis-sa/MASTER.md`，
由 `ui-ux-pro-max` 產出。改樣式前建議先看一眼，維持整站一致。

- 主色 `#1E3A5F`（學院藍）、強調色 `#A16207`（研究金）
- 標題襯線 EB Garamond + Noto Serif TC，內文 Noto Sans TC
- 所有顏色都以 CSS 變數定義在 `global.css` 的 `:root`，元件不寫死色碼

### 樣式為什麼全部集中在 `src/styles/`

本專案**不使用 Astro 的元件 scoped `<style>`**，所有樣式都寫在 `src/styles/` 的三個檔案裡。

原因是 scoped style 會在輸出的 HTML 每個元素上加一串 `data-astro-cid-xxxxxxx` 屬性。
集中管理後 HTML 乾淨，改樣式也只要找這三個檔案，不必逐一開啟元件。

代價是失去自動的樣式隔離，因此 **class 命名一律採 BEM**（`.區塊__元素--修飾`），
例如 `.officer__name`、`.announcement--compact`。新增元件時請沿用這個規則避免撞名。

載入順序在 `src/layouts/BaseLayout.astro` 決定：`global.css` → `components.css` → `pages.css`。
**不要改用 CSS `@import` 串接**——`@import` 只能放在檔首，會讓被匯入檔的優先級反而低於本檔規則。
