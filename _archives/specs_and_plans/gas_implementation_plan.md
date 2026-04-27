# Ares Blog CMS — Google Apps Script 實作計劃

## 系統架構總覽

```
Google Sheets（CMS 控制器）
    │
    ├── onEdit 觸發 → POST Cloud Build Webhook → 11ty 重新構建 → Firebase Hosting
    │
    └── doGet(e) Web App
          ├── ?sheet=posts        → 回傳所有 Posts_* 中已發布文章（供 fetch-google-data.js）
          ├── ?sheet=homepage     → 回傳 Homepage 分頁參數
          ├── ?sheet=news         → 回傳 News 分頁（newsData.js 呼叫）
          ├── ?sheet=about        → 回傳 About 分頁（aboutData.js 呼叫）
          └── ?sheet=siteconfig   → 回傳 SiteConfig 分頁
```

> [!IMPORTANT]
> GAS 部署為單一 **Web App**（一個 `doGet` 函式）以 `?sheet=` query string 路由分頁，避免多 URL 管理問題。

---

## Phase 1：建立試算表結構（手動操作）

### 1.1 建立 Google Sheets 檔案

1. 在 Google Drive 新增試算表，命名為 `Ares Blog CMS`
2. 依序建立 8 個分頁（Tab），順序與名稱必須完全一致：

| Tab | 分頁名稱 | 類型 |
|---|---|---|
| 1 | `Posts_能源科技` | 文章控制器 |
| 2 | `Posts_環境科學` | 文章控制器 |
| 3 | `Posts_SDGS` | 文章控制器 |
| 4 | `Posts_企業專訪` | 文章控制器 |
| 5 | `Homepage` | key-value |
| 6 | `News` | 混合型 |
| 7 | `About` | field-value |
| 8 | `SiteConfig` | key-value |

### 1.2 各分頁欄位配置（依 CMS Template）

#### Posts_* 分頁（4 個共用結構）

| A | B | C | D | E |
|---|---|---|---|---|
| `post_id` | `status` | `slug` | `drive_doc_id` | `last_updated` |

- Row 2 起為資料列
- `status` 欄設定下拉驗證：`草稿 / 已發布 / 下架`
- `drive_doc_id` 欄位現在改為填寫 **Google Docs** 的文件 ID（而非原本的 Markdown 檔案 ID）。

#### Homepage 分頁

| A | B |
|---|---|
| `key` | `value` |
| `hero_image` | （URL） |
| `carousel_energy_count` | `9` |
| `carousel_science_count` | `9` |
| `carousel_sdgs_count` | `9` |
| `carousel_interview_count` | `9` |
| `video_embed_url` | （YouTube embed URL） |
| `video_section_visible` | `TRUE` |

#### News 分頁

| row_type | hero_bg_url | hero_title | hero_date | hero_location | hero_summary | category_list | item_image_url | item_title | item_date | item_category | item_summary | item_link | item_visible |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `hero` | （URL） | （標題） | （日期文字） | （地點） | （摘要） | | | | | | | | |
| `categories` | | | | | | `活動資訊,媒體報導,系統更新` | | | | | | | |
| `item` | | | | | | | （URL） | （標題） | `2026-04-20` | `活動資訊` | （摘要） | （URL） | `TRUE` |

#### About 分頁

| A | B |
|---|---|
| `field` | `value` |
| `hero_bg_url` | |
| `name` | |
| `tagline` | |
| `core_value` | |
| `story_html` | |
| `traits` | |
| `photo_main_url` | |
| `photo_side1_url` | |
| `photo_side2_url` | |
| `cta_title` | |
| `cta_subtitle` | |

#### SiteConfig 分頁

| A | B |
|---|---|
| `key` | `value` |
| `site_title` | |
| `site_description` | |
| `site_author` | |
| `site_url` | |
| `og_default_image` | |
| `footer_ig_url` | |
| `footer_youtube_url` | |
| `footer_podcast_url` | |
| `footer_copyright` | |
| `footer_contact_email` | |
| `ga_measurement_id` | |
| `robots_noindex` | `FALSE` |

---

## Phase 2：GAS 程式碼架構

### 2.1 檔案結構（Apps Script 專案）

```
Ares Blog CMS (GAS Project)
├── Code.gs           ← 主入口：doGet / onEdit
├── PostsHandler.gs   ← 處理 Posts_* 4 個分頁
├── HomepageHandler.gs
├── NewsHandler.gs
├── AboutHandler.gs
├── SiteConfigHandler.gs
└── BuildTrigger.gs   ← 發送 Cloud Build Webhook
```

### 2.2 `Code.gs`（主入口）

```javascript
/**
 * Web App 主入口
 * URL 格式：
 * 1. ?sheet=posts|homepage|news|about|siteconfig
 * 2. ?action=doc2md&docId=YOUR_DOC_ID
 */
function doGet(e) {
  // 處理 Google Docs 轉譯 Markdown 請求
  const action = (e.parameter.action || "").toLowerCase();
  if (action === "doc2md") {
    const result = getGoogleDocAsMarkdown(e.parameter.docId);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = (e.parameter.sheet || "").toLowerCase();
  let result;

  try {
    switch (sheet) {
      case "posts":
        result = getPostsData();
        break;
      case "homepage":
        result = getHomepageData();
        break;
      case "news":
        result = getNewsData();
        break;
      case "about":
        result = getAboutData();
        break;
      case "siteconfig":
        result = getSiteConfigData();
        break;
      default:
        result = { error: "Unknown sheet parameter: " + sheet };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * onEdit 觸發器
 * 任一分頁編輯後，呼叫 Cloud Build Webhook
 */
function onEdit(e) {
  // 避免腳本屬性設定列（header row）被觸發
  if (e.range.getRow() < 2) return;
  triggerCloudBuild();
}
```

### 2.3 `PostsHandler.gs`

```javascript
/**
 * 讀取 Posts_能源科技 / Posts_環境科學 / Posts_SDGS / Posts_企業專訪
 * 回傳格式：{ data: [ { post_id, status, slug, drive_doc_id, last_updated, category }, ... ] }
 * 僅回傳 status = "已發布" 的列
 */
function getPostsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetConfigs = [
    { name: "Posts_能源科技",  category: "能源科技" },
    { name: "Posts_環境科學",  category: "環境科學" },
    { name: "Posts_SDGS",     category: "SDGS" },
    { name: "Posts_企業專訪",  category: "企業專訪" }
  ];

  const allPosts = [];

  sheetConfigs.forEach(config => {
    const sheet = ss.getSheetByName(config.name);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    const headers = data[0]; // ["post_id", "status", "slug", "drive_doc_id", "last_updated"]

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowObj = {};
      headers.forEach((h, idx) => { rowObj[h] = row[idx]; });

      if (rowObj.status === "已發布" && rowObj.slug) {
        allPosts.push({
          post_id: rowObj.post_id,
          status: rowObj.status,
          slug: rowObj.slug,
          drive_doc_id: rowObj.drive_doc_id,
          last_updated: rowObj.last_updated ? rowObj.last_updated.toString() : "",
          category: config.category
        });
      }
    }
  });

  return { data: allPosts };
}
```

### 2.4 `HomepageHandler.gs`

```javascript
/**
 * 讀取 Homepage 分頁（key-value 格式）
 * 回傳格式：{ data: { hero_image, carousel_energy_count, ..., video_embed_url, video_section_visible } }
 */
function getHomepageData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Homepage");
  if (!sheet) return { error: "Homepage sheet not found" };

  const data = sheet.getDataRange().getValues();
  const result = {};

  // 跳過 header row（第 0 列），從第 1 列起讀取 key / value
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    const value = data[i][1];
    if (key) result[key] = value;
  }

  return { data: result };
}
```

### 2.5 `NewsHandler.gs`

```javascript
/**
 * 讀取 News 分頁（混合型：hero / categories / item 三種 row_type）
 * 回傳格式：
 * {
 *   data: {
 *     hero: { hero_bg_url, hero_title, hero_date, hero_location, hero_summary },
 *     categories: ["活動資訊", "媒體報導", "系統更新"],
 *     items: [ { image_url, title, date, category, summary, link, visible }, ... ]
 *   }
 * }
 */
function getNewsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("News");
  if (!sheet) return { error: "News sheet not found" };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // 建立 header → index 映射
  const idx = {};
  headers.forEach((h, i) => { idx[h] = i; });

  let heroObj = {};
  let categories = [];
  const items = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowType = String(row[idx["row_type"]] || "").trim().toLowerCase();

    if (rowType === "hero") {
      heroObj = {
        hero_bg_url:  row[idx["hero_bg_url"]]  || "",
        hero_title:   row[idx["hero_title"]]    || "",
        hero_date:    row[idx["hero_date"]]     || "",
        hero_location: row[idx["hero_location"]] || "",
        hero_summary: row[idx["hero_summary"]]  || ""
      };

    } else if (rowType === "categories") {
      const catStr = String(row[idx["category_list"]] || "");
      categories = catStr.split(",").map(s => s.trim()).filter(Boolean);

    } else if (rowType.startsWith("item")) {
      const visible = String(row[idx["item_visible"]] || "TRUE").toUpperCase();
      if (visible === "FALSE") continue;

      items.push({
        image_url: row[idx["item_image_url"]] || "",
        title:     row[idx["item_title"]]     || "",
        date:      row[idx["item_date"]] ? row[idx["item_date"]].toString() : "",
        category:  row[idx["item_category"]]  || "",
        summary:   row[idx["item_summary"]]   || "",
        link:      row[idx["item_link"]]      || ""
      });
    }
  }

  // 依 date 降冪排序
  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  return { data: { hero: heroObj, categories: categories, items: items } };
}
```

### 2.6 `AboutHandler.gs`

```javascript
/**
 * 讀取 About 分頁（field-value 格式）
 * 回傳格式：{ data: { hero_bg_url, name, tagline, ... } }
 */
function getAboutData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("About");
  if (!sheet) return { error: "About sheet not found" };

  const data = sheet.getDataRange().getValues();
  const result = {};

  for (let i = 1; i < data.length; i++) {
    const field = String(data[i][0]).trim();
    const value = data[i][1];
    if (field) result[field] = value;
  }

  return { data: result };
}
```

### 2.7 `SiteConfigHandler.gs`

```javascript
/**
 * 讀取 SiteConfig 分頁（key-value 格式）
 * 回傳格式：{ data: { site_title, site_description, ... } }
 */
function getSiteConfigData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("SiteConfig");
  if (!sheet) return { error: "SiteConfig sheet not found" };

  const data = sheet.getDataRange().getValues();
  const result = {};

  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    const value = data[i][1];
    if (key) result[key] = value;
  }

  return { data: result };
}
```

### 2.8 `BuildTrigger.gs`

```javascript
/**
 * 發送 POST 至 Cloud Build Webhook
 * WEBHOOK_URL 與 WEBHOOK_SECRET 存放於 Script Properties（不寫入程式碼）
 */
function triggerCloudBuild() {
  const props = PropertiesService.getScriptProperties();
  const webhookUrl = props.getProperty("CLOUD_BUILD_WEBHOOK_URL");
  if (!webhookUrl) {
    console.warn("[BuildTrigger] CLOUD_BUILD_WEBHOOK_URL not set in Script Properties.");
    return;
  }

  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      payload: JSON.stringify({ trigger: "onEdit", timestamp: new Date().toISOString() }),
      muteHttpExceptions: true
    });

    console.log("[BuildTrigger] Response:", response.getResponseCode(), response.getContentText());
  } catch (err) {
    console.error("[BuildTrigger] Failed to trigger build:", err.message);
  }
}
```

### 2.9 `DocToMarkdown.gs`（Google Docs 轉譯模組）

> [!NOTE]
> 為了讓作者能使用 Google Docs 撰寫文章，GAS 需提供 API，讀取指定 Google Doc 並將基本格式（標題、段落）轉譯為 Markdown，供前端構建時寫入本地檔案。

```javascript
/**
 * 讀取指定的 Google Doc 並將內容轉換為 Markdown
 * 呼叫方式：?action=doc2md&docId=YOUR_DOC_ID
 */
function getGoogleDocAsMarkdown(docId) {
  if (!docId) return { error: "docId is required" };
  
  try {
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();
    const paragraphs = body.getParagraphs();
    let mdContent = "";

    // 簡易 Google Doc 轉 Markdown 邏輯
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const type = p.getHeading();
      const text = p.getText();

      if (text === "") {
        mdContent += "\n";
        continue;
      }

      switch (type) {
        case DocumentApp.ParagraphHeading.HEADING1:
          mdContent += `# ${text}\n\n`; break;
        case DocumentApp.ParagraphHeading.HEADING2:
          mdContent += `## ${text}\n\n`; break;
        case DocumentApp.ParagraphHeading.HEADING3:
          mdContent += `### ${text}\n\n`; break;
        case DocumentApp.ParagraphHeading.HEADING4:
          mdContent += `#### ${text}\n\n`; break;
        default:
          mdContent += `${text}\n\n`; break;
      }
    }
    
    return { data: { markdown: mdContent } };
  } catch (err) {
    return { error: "Failed to parse Google Doc: " + err.message };
  }
}
```

---

## Phase 3：前端 `_data` 檔案更新

### 3.1 `newsData.js` 修改點

現有 `newsData.js` 使用舊版欄位格式（`is_hero` 欄位），需更新為新版 `row_type` 結構：

```diff
- const rows = response.data || [];
- rows.forEach(row => {
-   if (String(row.is_hero).toUpperCase() === "TRUE") { ... }
-   else if (row.title) { items.push(row); }
- });
- return { hero: ..., items: ... };

+ // 新版 GAS 回傳格式：{ data: { hero: {...}, categories: [...], items: [...] } }
+ return {
+   hero: response.data?.hero || FALLBACK_HERO,
+   categories: response.data?.categories || [],
+   items: response.data?.items || FALLBACK_ITEMS
+ };
```

> [!NOTE]
> `newsData.js` 同時需要加入 `categories` 欄位供 `news.njk` 的篩選按鈕動態渲染。

### 3.2 `aboutData.js` 修改點

回傳格式從 `response.data`（陣列）改為直接物件存取：

```diff
- const rows = response.data || [];
- const result = {};
- rows.forEach(row => { if (row.field) result[row.field] = row.value; });
- return Object.keys(result).length ? result : FALLBACK;

+ // 新版 GAS 回傳格式：{ data: { hero_bg_url: "...", name: "...", ... } }
+ return Object.keys(response.data || {}).length ? response.data : FALLBACK;
```

---

## Phase 4：部署流程

### 4.1 GAS 部署步驟

1. 開啟 Google Sheets → 工具列 → 「擴充功能」→「Apps Script」
2. 建立上述 6 個 `.gs` 檔案，依序貼入對應程式碼
3. 設定 Script Properties（安全憑證，不寫入程式碼）：
   - 「專案設定」→「指令碼屬性」
   - 新增 `CLOUD_BUILD_WEBHOOK_URL`：填入 Cloud Build Webhook URL
4. 部署 Web App：
   - 「部署」→「新增部署」→ 類型選「Web 應用程式」
   - 執行身分：`我`（Me）
   - 存取權：`任何人`（Anyone）
   - 按「部署」，複製 Web App URL

5. 安裝 `onEdit` 觸發器（**必須使用可安裝觸發器**，非簡單觸發器）：
   - 「觸發條件」→「新增觸發條件」
   - 函式：`onEdit`
   - 觸發類型：`試算表` → `編輯時`

> [!WARNING]
> GAS 的 `onEdit` 簡單觸發器（無法使用 `UrlFetchApp`）。必須在「觸發條件」面板安裝「可安裝觸發器」，才能在 `onEdit` 中呼叫 `UrlFetchApp`。

### 4.2 前端環境變數設定

在 Firebase / Cloud Build CI/CD 中設定以下環境變數（取代 fallback 模式）：

| 變數名稱 | 值 |
|---|---|
| `NEWS_SHEET_URL` | `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?sheet=news` |
| `ABOUT_SHEET_URL` | `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?sheet=about` |
| `POSTS_SHEET_URL` | `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?sheet=posts` |
| `HOMEPAGE_SHEET_URL` | `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?sheet=homepage` |
| `SITECONFIG_SHEET_URL` | `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?sheet=siteconfig` |

---

## Phase 5：驗證清單

| 項目 | 驗證方式 |
|---|---|
| GAS Web App 可正常回傳 JSON | 直接在瀏覽器開啟 `{WEB_APP_URL}?sheet=news`，確認 JSON 格式正確 |
| `newsData.js` 讀取成功 | 本地執行 `npm run dev`，檢查 `news.njk` 是否渲染 categories 篩選按鈕 |
| `aboutData.js` 讀取成功 | 檢查 `about.njk` 是否渲染 Sheets 中的 name / tagline |
| `onEdit` 觸發 Webhook | 在試算表隨意編輯一格，觀察 Cloud Build 是否啟動 |
| Posts 資料流通 | 在 `Posts_能源科技` 新增一列並設為「已發布」，觸發構建後檢查首頁 Carousel |

---

## 待確認事項

> [!NOTE]
> 以下 2 個問題需要確認後才能完整實作：

1. **`fetch-google-data.js` 實作需求確認**  
   Posts 資料需要一支 Node.js 腳本在 Cloud Build/11ty 構建時執行。流程變更為：從 GAS 抓取文章清單後，**針對每篇文章呼叫 `?action=doc2md&docId={ID}` 取得轉譯後的 Markdown 內容**，並寫入 `src/posts/{slug}.md`。目前尚未見此腳本，需安排後續開發。

2. **Cloud Build Webhook URL 是否已設定？**  
   `CLOUD_BUILD_WEBHOOK_URL` 需要 GCP 專案中的 Cloud Build Trigger Webhook URL。若尚未建立，需先完成 Cloud Build Trigger 配置。
