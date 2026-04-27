# Ares's Blog — Google Sheets 中繼資料管理系統設計規格

> 試算表名稱建議：`Ares Blog CMS`
> 架構邏輯：每個分頁（Sheet Tab）對應一個功能模組，GAS 以分頁名稱作為路由依據，分別輸出 JSON 供 11ty 構建時讀取。
> 觸發邏輯：所有分頁統一採用 `onEdit` 自動觸發，任一分頁有欄位編輯時，GAS 即發送 POST 至 Cloud Build Webhook，觸發 11ty 重新構建並部署。

## 分工原則

| 層級 | 職責 | 管理位置 |
|---|---|---|
| **內容層** | 文章標題、日期、作者、摘要、標籤、封面圖、正文 | `.md` 檔案 Front Matter + 正文（存放於 Google Drive） |
| **控制層** | 發布狀態、URL Slug、構建觸發 | Google Sheets（本文件定義的各分頁） |

Sheets **不重複儲存** `.md` 中已存在的欄位（`title`、`date`、`author`、`summary`、`tags`、`cover_image`、`layout`），僅作為控制器使用。

---

## 分頁總覽（Tab Index）

| 順序 | 分頁名稱 | 對應導覽頁面 | 類型 |
|---|---|---|---|
| 1 | `Posts_能源科技` | 能源科技（`/archive/energy/`） | 文章控制器 |
| 2 | `Posts_環境科學` | 環境科學（`/archive/science/`） | 文章控制器 |
| 3 | `Posts_SDGS` | SDGS（`/archive/sdgs/`） | 文章控制器 |
| 4 | `Posts_企業專訪` | 企業專訪（`/archive/interview/`） | 文章控制器 |
| 5 | `Homepage` | 首頁（Hero + Carousel + 影音精選） | 模組參數 |
| 6 | `News` | 最新消息（`/archive/latest/`） | 頁面資料 |
| 7 | `About` | 關於我（`/about/`） | 靜態內容 |
| 8 | `SiteConfig` | 全站設定（SEO / Footer / 社群連結） | 全域設定 |

---

## 分頁 1–4：`Posts_*`（文章控制器）

四個分頁結構完全相同，差異僅在分頁名稱所對應的分類。

- `Posts_能源科技`：管理 `tags[0] = 能源科技` 的文章
- `Posts_環境科學`：管理 `tags[0] = 環境科學` 的文章
- `Posts_SDGS`：管理 `tags[0] = SDGS` 的文章
- `Posts_企業專訪`：管理 `tags[0] = 企業專訪` 的文章

GAS 構建流程：讀取各分頁中 `status = 已發布` 的列 → 以 `drive_doc_id` 從 Google Drive 抓取對應 `.md` 檔案 → 寫入 `src/posts/`。

### 欄位定義（4 個分頁共用結構）

| 欄位名稱（A 欄起） | 資料格式 | 必填 | 填入方式 | 說明 |
|---|---|---|---|---|
| `post_id` | 文字（流水號，如 `EN-001`） | 是 | GAS 自動產生 | 唯一識別碼，各分頁使用不同前綴 |
| `title` | 文字 | 否 | 作者手動填寫 | 文章標題，僅供後台辨識使用，GAS 不會以此覆蓋 `.md` 內的標題 |
| `status` | 下拉選單：`草稿 / 已發布 / 下架` | 是 | 作者手動選擇 | 核心控制欄位：改為「已發布」即觸發構建上線；改為「下架」則移除 |
| `slug` | 文字（小寫英文 + 連字號，如 `solar-energy-2025`） | 是 | 作者手動填寫 | 決定文章 URL：`/posts/{slug}/`。發布後不可更改 |
| `drive_doc_id` | 文字（Google Drive 檔案 ID） | 是 | 作者手動填寫 | Drive 中 `.md` 原稿的檔案 ID，GAS 以此抓取正文與 Front Matter |
| `last_updated` | 日期時間（`YYYY-MM-DD HH:mm`） | 是 | GAS 自動填入 | 最後修改時間，供 GAS 判斷是否需重新構建 |

### 各分頁 `post_id` 前綴規則

| 分頁 | 前綴 | 範例 |
|---|---|---|
| `Posts_能源科技` | `EN-` | `EN-001`、`EN-002` |
| `Posts_環境科學` | `EV-` | `EV-001`、`EV-002` |
| `Posts_SDGS` | `SD-` | `SD-001`、`SD-002` |
| `Posts_企業專訪` | `IV-` | `IV-001`、`IV-002` |

### 操作規則

1. **發布流程**：作者在 Drive 完成 `.md` 撰寫 → 在對應分頁新增一列，填入 `slug` 與 `drive_doc_id` → 將 `status` 改為「已發布」→ GAS 自動觸發 Cloud Build。
2. **下架流程**：將 `status` 改為「下架」→ 下次構建時該文章不再輸出。
3. **`slug` 不可變更**：發布後修改 `slug` 會導致舊 URL 變成 404。
4. **分頁歸屬由 `.md` 的 `tags[0]` 決定**：Sheets 分頁僅作管理分類用途，實際分類邏輯以 `.md` Front Matter 中的 `tags[0]` 為準。

---

## 分頁 5：`Homepage`（首頁模組參數）

對應導覽頁面：**首頁（`/`）**

此分頁採 `key | value` 格式，控制首頁各模組的動態參數。

### 欄位定義（`key | value` 格式）

Hero 區塊的文章內容（標題、分類、日期、摘要）全數自動化，GAS 自動取所有 `Posts_*` 中 `date` 最新一筆文章的 Front Matter 填入，作者僅需手動設定底圖。

| key | value 範例 | 必填 | 填入方式 | 說明 |
|---|---|---|---|---|
| `hero_image` | URL | 是 | 作者手動填寫 | Hero 背景圖 URL。此為 Hero 區塊唯一需手動設定的欄位，其餘（標題、分類、日期、摘要）自動從最新文章的 `.md` Front Matter 讀取 |
| `carousel_energy_count` | `9` | 是 | 作者手動填寫 | 首頁「能源科技」Carousel 最多顯示篇數（上限 9） |
| `carousel_science_count` | `9` | 是 | 作者手動填寫 | 首頁「環境科學」Carousel 最多顯示篇數（上限 9） |
| `carousel_sdgs_count` | `9` | 是 | 作者手動填寫 | 首頁「SDGS」Carousel 最多顯示篇數（上限 9） |
| `carousel_interview_count` | `9` | 是 | 作者手動填寫 | 首頁「企業專訪」Carousel 最多顯示篇數（上限 9） |
| `video_embed_url` | `https://www.youtube.com/embed/XXXX` | 否 | 作者手動填寫 | 首頁「影音精選」區塊的 YouTube embed URL |
| `video_section_visible` | `TRUE` 或 `FALSE` | 是 | 作者手動選擇 | 控制影音精選區塊顯示/隱藏 |

### Hero 自動化邏輯

GAS 構建時自動執行以下流程，作者無需手動操作：

1. 掃描所有 `Posts_*` 分頁中 `status = 已發布` 的文章
2. 以各 `.md` Front Matter 中的 `date` 降冪排序，取第 1 筆
3. 自動讀取該文章的 `title`、`tags[0]`（分類）、`date`、`summary` 填入 Hero 區塊
4. 背景圖使用 `hero_image` 欄位值

---

## 分頁 6：`News`（最新消息）

對應導覽頁面：**最新消息（`/archive/latest/`）**
對應前端模板：`news.njk`（使用 `page.njk` layout）
對應資料來源：`newsData.js`（EleventyFetch）

此分頁為**頁面資料型**，管理活動資訊、媒體報導等動態訊息。GAS 將分頁資料轉換為 `{ hero: {...}, categories: [...], items: [...] }` 格式的 JSON，透過 `newsData.js` 供 `news.njk` 渲染。

### 分頁結構說明

此分頁包含三種列類型，以 `row_type` 欄位區分：

1. **Hero 設定列**（`row_type = hero`）：僅一列，定義頁面頂部 Hero 區塊
2. **分類設定列**（`row_type = categories`）：僅一列，定義篩選按鈕的分類清單
3. **消息項目列**（`row_type = item*`）：多列，每列代表一則消息（如 `item1`, `item2`）

### 欄位定義

#### 共用欄位

| 欄位名稱 | 資料格式 | 必填 | 填入方式 | 說明 |
|---|---|---|---|---|
| `row_type` | 下拉選單：`hero / categories / item` | 是 | 作者手動選擇 | 區分列類型。整個分頁僅應有一列 `hero`、一列 `categories`，其餘均為 `item` |

#### Hero 設定列專用欄位（`row_type = hero`）

GAS 輸出為 `newsData.hero` 物件。

| 欄位名稱 | 資料格式 | 必填 | 填入方式 | 前端對應 |
|---|---|---|---|---|
| `hero_bg_url` | URL 文字 | 是 | 作者手動填寫 | `newsData.hero.hero_bg_url` → Hero 背景圖 |
| `hero_title` | 文字 | 是 | 作者手動填寫 | `newsData.hero.hero_title` → Hero H1 標題 |
| `hero_date` | 文字（如 `2026 年 5 月 10 日`） | 是 | 作者手動填寫 | `newsData.hero.hero_date` → 日期顯示 |
| `hero_location` | 文字 | 否 | 作者手動填寫 | `newsData.hero.hero_location` → 地點顯示。留空時不顯示 |
| `hero_summary` | 文字（上限 150 字） | 是 | 作者手動填寫 | `newsData.hero.hero_summary` → 摘要文字 |

#### 分類設定列專用欄位（`row_type = categories`）

GAS 輸出為 `newsData.categories` 陣列，前端以此動態產生篩選按鈕（「全部」按鈕為系統預設，不需在此定義）。

| 欄位名稱 | 資料格式 | 必填 | 填入方式 | 說明 |
|---|---|---|---|---|
| `category_list` | 文字（以半形逗號分隔，如 `活動資訊,媒體報導,系統更新`） | 是 | 作者手動填寫 | 定義所有可用的消息分類。作者可隨時新增、刪除或重新命名分類，前端篩選按鈕會自動同步更新 |

**操作範例**：

| 作者填入值 | 前端產生的篩選按鈕 |
|---|---|
| `活動資訊,媒體報導,系統更新` | 全部 / 活動資訊 / 媒體報導 / 系統更新 |
| `活動資訊,媒體報導,系統更新,合作公告` | 全部 / 活動資訊 / 媒體報導 / 系統更新 / 合作公告 |
| `公告,活動` | 全部 / 公告 / 活動 |

#### 消息項目列專用欄位（`row_type = item*`）

GAS 將所有 `item*` 列依 `item_date` 降冪排序後輸出為 `newsData.items` 陣列。

| 欄位名稱 | 資料格式 | 必填 | 填入方式 | 前端對應 |
|---|---|---|---|---|
| `row_type` | 文字（如 `item1`, `item2`） | 是 | 作者手動填寫 | 識別為消息項目 |
| `item_image_url` | URL 文字 | 否 | 作者手動填寫 | `item.image_url` → 左側縮圖。留空時使用預設佔位圖 |
| `item_title` | 文字 | 是 | 作者手動填寫 | `item.title` → 消息標題 |
| `item_date` | 日期（`YYYY-MM-DD`） | 是 | 作者手動填寫 | `item.date` → 消息日期標籤 |
| `item_category` | 文字（必須與 `category_list` 中的某一項完全一致） | 是 | 作者手動填寫 | `item.category` → 分類標籤 |
| `item_summary` | 文字（上限 100 字） | 是 | 作者手動填寫 | `item.summary` → 摘要文字 |
| `item_link` | URL 文字 | 否 | 作者手動填寫 | `item.link` → 點擊跳轉目標 |
| `item_visible` | `TRUE` 或 `FALSE` | 是 | 作者手動選擇 | `FALSE` 時不輸出至前端 |

### 操作規則

1. **Hero 列唯一性**：整個分頁只能有一列 `row_type = hero`，多列時 GAS 僅取第一列。
2. **分類管理**：修改 `category_list` 即可新增或刪除分類，前端篩選按鈕自動同步。修改分類名稱時，需同步更新所有 `item` 列中對應的 `category` 值，否則該消息會無法被篩選。
3. **新增消息**：在分頁底部新增一列，`row_type` 填入 `item*`（如 `item4`），`item_category` 填入 `category_list` 中的某一項。
4. **隱藏消息**：將 `visible` 改為 `FALSE`，資料保留但不輸出。

---

## 分頁 7：`About`（關於我）

對應導覽頁面：**關於我（`/about/`）**
對應前端模板：`about.njk`（使用 `page.njk` layout）
對應資料來源：`aboutData.js`（EleventyFetch）

採 `field | value` 格式，GAS 輸出 JSON 物件供 `about.njk` 渲染。

### 欄位定義（`field | value` 格式）

| field | value 說明 | 必填 | 填入方式 |
|---|---|---|---|
| `hero_bg_url` | Hero 背景圖 URL | 是 | 作者手動填寫 |
| `name` | 顯示名稱，如 `Ares Chen` | 是 | 作者手動填寫 |
| `tagline` | Hero 下方標語 | 是 | 作者手動填寫 |
| `core_value` | 核心價值段落文字 | 是 | 作者手動填寫 |
| `story_html` | 「我的故事」HTML 內文（可含 `<p>` 標籤） | 是 | 作者手動填寫 |
| `traits` | 個性特色標籤，以「`・`」分隔 | 是 | 作者手動填寫 |
| `photo_main_url` | 故事區塊主要人像圖 URL | 是 | 作者手動填寫 |
| `photo_side1_url` | 故事區塊側邊小圖 1 URL | 否 | 作者手動填寫 |
| `photo_side2_url` | 故事區塊側邊小圖 2 URL | 否 | 作者手動填寫 |
| `cta_title` | 聯絡區塊標題 | 是 | 作者手動填寫 |
| `cta_subtitle` | 聯絡區塊副標 | 是 | 作者手動填寫 |

---

## 分頁 8：`SiteConfig`（全站設定）

對應：**全域參數，影響所有頁面的 SEO、Footer、社群連結**

採 `key | value` 格式，GAS 輸出為 `site.json` 的延伸資料，11ty 全域讀取。

### 欄位定義（`key | value` 格式）

| key | value 說明 | 必填 | 填入方式 |
|---|---|---|---|
| `site_title` | 網站標題 | 是 | 作者手動填寫 |
| `site_description` | 網站 meta description | 是 | 作者手動填寫 |
| `site_author` | 作者名稱 | 是 | 作者手動填寫 |
| `site_url` | 正式上線 URL，用於 Sitemap 與 Open Graph | 是 | 作者手動填寫 |
| `og_default_image` | 社群分享預設縮圖 URL | 否 | 作者手動填寫 |
| `footer_ig_url` | Instagram 連結 | 否 | 作者手動填寫 |
| `footer_youtube_url` | YouTube 頻道連結 | 否 | 作者手動填寫 |
| `footer_podcast_url` | Podcast 連結 | 否 | 作者手動填寫 |
| `footer_copyright` | 版權文字 | 是 | 作者手動填寫 |
| `footer_contact_email` | 頁尾聯絡 Email | 否 | 作者手動填寫 |
| `ga_measurement_id` | Google Analytics 測量 ID | 否 | 作者手動填寫 |
| `robots_noindex` | `TRUE` 或 `FALSE`：是否阻止 Google 索引 | 是 | 作者手動選擇 |

---

## GAS 串接架構摘要

```
試算表 (Google Sheets)  ── 統一 onEdit 自動觸發 ──▶  Cloud Build Webhook
│
└── 讀取方向（Sheets + Drive → 11ty Build）
    ├── Posts_能源科技  ─┐
    ├── Posts_環境科學  ─┤
    ├── Posts_SDGS      ─┼→ fetch-google-data.js
    ├── Posts_企業專訪  ─┘    ├─ 讀取 Sheets 控制欄位（status/slug）
    │                         ├─ 以 drive_doc_id 從 Drive 抓取 .md 原稿
    │                         └─ 合併後寫出至 src/posts/
    │
    ├── Homepage   → fetch-google-data.js → 注入 index.md Front Matter
    ├── News       → newsData.js (EleventyFetch) → 渲染 news.njk
    ├── About      → aboutData.js (EleventyFetch) → 渲染 about.njk
    └── SiteConfig → fetch-google-data.js → 覆蓋 src/_data/site.json
```

### 觸發邏輯

所有分頁統一採用 `onEdit` 自動觸發。GAS `onEdit` handler 偵測到任一分頁的任一欄位被編輯時，自動發送帶有 Identity Token 的 POST 請求至 Cloud Build Webhook，觸發 11ty 重新構建並部署至 Firebase Hosting。

| 分頁 | 觸發方式 | 條件 |
|---|---|---|
| `Posts_*`（4 個） | `onEdit` 自動 | 任一欄位編輯即觸發 |
| `Homepage` | `onEdit` 自動 | 任一 `value` 欄位編輯即觸發 |
| `News` | `onEdit` 自動 | 任一欄位編輯即觸發 |
| `About` | `onEdit` 自動 | 任一 `value` 欄位編輯即觸發 |
| `SiteConfig` | `onEdit` 自動 | 任一 `value` 欄位編輯即觸發 |
