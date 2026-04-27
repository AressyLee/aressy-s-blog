/**
 * 讀取 SiteConfig 分頁（key-value 格式）
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
