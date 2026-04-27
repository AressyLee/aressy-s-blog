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
