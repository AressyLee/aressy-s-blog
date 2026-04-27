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
