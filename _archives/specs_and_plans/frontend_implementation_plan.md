# 實作計畫：Ares's Blog 靜態網站與自動化建置 (Style 1: 當代編輯排版風)

此計畫基於您提供的 Function Spec Document (FSD) 與前述討論的「風格一：當代編輯排版風（Contemporary Editorial）」所制定。目標是打造一個以 11ty 為靜態網站生成器、Google 生態系（Drive/Sheets）為無頭內容管理系統（Headless CMS），並擁有高級編輯排版質感的自動化部落格。

> [!IMPORTANT]
> **風格調校確認**
> FSD 文件中原先建議了「科技深藍 (#003366 系列) / 泛科學風格」。但根據您稍早的指示，我們將改為採用 **風格一：當代編輯排版風**：
> - **主背景色**：暖米白色 (Warm Beige)
> - **強調色**：深群青藍 (Ultramarine Blue)
> - **排版特徵**：優雅襯線體搭配無襯線體、1px 俐落細線、大面積留白。
> 
> 此計畫的 Phase 2 將會以此視覺規範進行切版與樣式設定。

## 階段性實作計畫 (Phased Implementation Plan)

### Phase 1: 專案初始化與 11ty 核心架構 (Environment Setup)
建立專案的基礎結構，並配置 11ty 渲染環境。

- 初始化 Node.js 專案 (`package.json`) 並安裝 11ty 相關套件。
- 建立 `.eleventy.js` 核心設定檔。
- 依照 FSD 建立資料夾結構（例如 `src/_includes`, `src/posts`, `src/_data` 等）。
- 建立全域資料檔：`site.json` 與 `navigation.json`。
- 建立基礎 Layout (`base.njk`, `post.njk`, `category.njk`) 與基礎路由頁面 (`index.md`, `archive/*`)。

### Phase 2: 視覺與前端組件開發 (Design System & UI Components)
導入「當代編輯排版風」，開發可複用的前端組件。

- 建立 `assets/css`：定義暖米白與深群青藍的色彩變數、配置字體（Serif / Sans-serif）與 RWD 斷點。
- 實作 1px 細線的網格系統（Grid System）。
- 開發核心組件：
  - `hero.njk`：首頁強打區域（大字級標題、留白排版）。
  - `card.njk`：文章列表卡片（支援分類、標籤、摘要與日期顯示）。
  - `nav.njk` & `footer.njk`：頂部導覽列與頁尾。
- 套用樣式至首頁、分類頁與單一文章內頁。

### Phase 3: 資料串接腳本開發 (Headless CMS Integration)
撰寫 Node.js 腳本以銜接 Google Drive 與 Google Sheets。

- 開發 `scripts/fetch-google-data.js`：
  - 串接 Google Sheets API：獲取文章列表中繼資料（狀態、Slug 等）。
  - 串接 Google Drive API：下載 Markdown 檔案內容。
- 實作資料轉換邏輯：將獲取的內容加上 FSD 規範的 Front Matter（標題、日期、作者、摘要、圖片、標籤）並寫入 `src/posts/`。
> [!NOTE]
> 此階段需要您協助提供 Google Cloud Service Account 金鑰，以便順利測試 API 串接。

### Phase 4: CI/CD 與部署配置 (CI/CD & Deployment)
設定自動化部署流程。

- 撰寫 `cloudbuild.yaml`：定義自動化流程：`Install` -> `Fetch` -> `Build` -> `Deploy`。
- 配置 `firebase.json`：設定 Firebase Hosting 的發佈目錄為 `_site`。

## Verification Plan (驗證計畫)

### Automated Tests / Scripts
- 執行 `node scripts/fetch-google-data.js`：確認能成功從 Google API 拉取資料並產生正確的 Markdown 檔案。
- 執行 `npx @11ty/eleventy`：確認本地編譯過程無錯誤，且順利產出 HTML 至 `_site` 目錄。

### Manual Verification
- **本地預覽**：啟動 `npx @11ty/eleventy --serve`，透過瀏覽器檢查：
  - 首頁 Hero 區塊與文章分類區塊是否正確渲染。
  - 視覺風格是否精準呈現「當代編輯排版風」（色彩、字體、細線網格、響應式佈局）。
- **資料整合測試**：使用測試用 Markdown 檔驗證 Front Matter 解析是否正確套用至網頁。
