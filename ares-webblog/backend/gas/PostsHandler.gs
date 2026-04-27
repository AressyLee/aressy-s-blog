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
    const headers = data[0];

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
          category: config.category,
          title: rowObj.title || "",
          author: rowObj.author || "Ares",
          summary: rowObj.summary || "",
          cover_image: rowObj.cover_image || ""
        });
      }
    }
  });

  return { data: allPosts };
}
