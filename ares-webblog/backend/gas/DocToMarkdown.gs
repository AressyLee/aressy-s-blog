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

/**
 * 專門用來觸發 Google 文件授權畫面的測試函式
 * 請在編輯器中選擇此函式並點擊「執行」
 */
function forceAuth() {
  DocumentApp.create("授權測試文件");
}
