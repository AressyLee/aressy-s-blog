/**
 * 讀取 About 分頁（field-value 格式）
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
