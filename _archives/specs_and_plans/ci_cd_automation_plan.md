# Ares Blog CI/CD 自動化部署實作計畫

這是一個將 Google Sheets 透過 Webhook 串接至 Google Cloud Build，以實現全自動化 CI/CD 的實作計畫。

## 階段一：原始碼雲端化 (Source Control)
Cloud Build 必須要有一個來源來拉取（Pull）您的程式碼進行編譯。
1. **建立儲存庫**：在 GitHub（或 Google Cloud Source Repositories）建立一個私有儲存庫（Private Repository）。
2. **推播程式碼**：將本地端的程式碼推播至雲端儲存庫。
3. **環境變數管理**：確保 `.env` 檔案不被上傳（透過 `.gitignore`），環境變數後續將統一交由 Cloud Build 管理。

## 階段二：撰寫構建設定檔 (`cloudbuild.yaml`)
在專案根目錄建立 `cloudbuild.yaml` 檔案，這是給 Cloud Build 看的腳本，指示它接收到 Webhook 後要做哪些事。
*   **Step 1 (Install)**: 執行 `npm install` 安裝所有依賴套件。
*   **Step 2 (Build)**: 執行 `npm run build`，這會觸發 `fetch-google-data.js` 去向 GAS 抓取資料，接著執行 11ty 產生靜態網頁到 `_site` 資料夾。
*   **Step 3 (Deploy)**: 執行 `firebase deploy --non-interactive` 將 `_site` 的內容部署上線。

## 階段三：設定 GCP Cloud Build Trigger (Webhook)
在 Google Cloud Console (GCP) 的介面中進行基礎設施設定。
1. **啟用 API**：確認您的 GCP 專案已啟用 Cloud Build API。
2. **建立觸發條件 (Trigger)**：
   * 選擇事件類型：**Webhook 事件**。
   * 連結來源：選擇階段一建立的 GitHub 儲存庫。
   * 產生 URL：GCP 會為您生成一組專屬的 Webhook URL 與 Secret（金鑰）。

## 階段四：Firebase 部署身分驗證
Cloud Build 在雲端環境執行，需要取得授權才能將檔案推送到您的 Firebase 專案。
1. **產生憑證**：在您的本地端終端機執行 `firebase login:ci`，這會產生一串專供 CI/CD 系統使用的授權 Token。
2. **安全儲存**：將這串 Token 存放到 GCP 的 **Secret Manager** 中。
3. **授權 Cloud Build**：在 `cloudbuild.yaml` 中設定，讓系統在部署時安全地讀取這組 Token 進行身分驗證。

## 階段五：Google Sheets 端 (GAS) Webhook 發送
將 GCP 產生的 Webhook URL 回填至 Google Sheets 的後台。
1. **設定金鑰**：在 GAS 編輯器中，將 Webhook URL 填入「指令碼屬性 (Script Properties)」，避免網址外流。
2. **實作 POST 請求**：在 `BuildTrigger.gs` 中撰寫程式碼，透過 `UrlFetchApp` 模組，向 Webhook URL 發出帶有驗證資訊的 POST 請求。
3. **安裝觸發器**：在 GAS 後台手動建立一個「可安裝觸發器 (Installable Trigger)」，設定當試算表發生「編輯 (onEdit)」時，執行上述的 POST 程式碼。

---

**流程總結**：
當未來這五個階段實作完成後，完整的工作流將變成：
`編輯 Google Sheet` ➜ `GAS 發送 Webhook` ➜ `Cloud Build 收到通知` ➜ `拉取 GitHub 程式碼` ➜ `抓取 Sheet 資料並編譯` ➜ `Firebase 自動上線`。
