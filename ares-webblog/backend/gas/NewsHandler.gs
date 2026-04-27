/**
 * 讀取 News 分頁（混合型：hero / categories / item 三種 row_type）
 */
function getNewsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("News");
  if (!sheet) return { error: "News sheet not found" };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

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
      const visible = String(row[idx["item_visible"]] || row[idx["visible"]] || "TRUE").toUpperCase();
      if (visible === "FALSE") continue;

      items.push({
        image_url: row[idx["item_image_url"]] || row[idx["image_url"]] || "",
        title:     row[idx["item_title"]]     || row[idx["title"]]     || "",
        date:      (row[idx["item_date"]] || row[idx["date"]]) ? new Date(row[idx["item_date"]] || row[idx["date"]]).toISOString().split('T')[0] : "",
        category:  row[idx["item_category"]]  || row[idx["category"]]  || "",
        summary:   row[idx["item_summary"]]   || row[idx["summary"]]   || "",
        link:      row[idx["item_link"]]      || row[idx["link"]]      || ""
      });
    }
  }

  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  return { data: { hero: heroObj, categories: categories, items: items } };
}
