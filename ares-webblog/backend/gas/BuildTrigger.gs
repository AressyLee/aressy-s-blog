/**
 * 發送 Webhook 觸發 GitHub Actions 進行自動部署
 * 請將此指令碼貼至 Google Apps Script 編輯器，並設定「編輯 (onEdit)」觸發器。
 */
function triggerGitHubActions() {
  // 從指令碼屬性 (Script Properties) 中取得 GitHub Personal Access Token
  const scriptProperties = PropertiesService.getScriptProperties();
  const ghToken = scriptProperties.getProperty('GH_PAT');
  
  if (!ghToken) {
    console.warn("[BuildTrigger] 錯誤：找不到 GH_PAT，請在專案設定的指令碼屬性中新增。");
    return;
  }

  // GitHub 儲存庫資訊：請確認替換為正確的使用者名稱與儲存庫名稱
  const repoOwner = "AressyLee";
  const repoName = "aressy-s-blog";
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`;

  const payload = {
    "event_type": "trigger-build"
  };

  const options = {
    "method": "post",
    "headers": {
      "Accept": "application/vnd.github.v3+json",
      "Authorization": `Bearer ${ghToken}`
    },
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    console.log(`[BuildTrigger] GitHub Actions 觸發結果回應碼：${response.getResponseCode()}`, response.getContentText());
  } catch (error) {
    console.error(`[BuildTrigger] 觸發失敗：${error.toString()}`);
  }
}
