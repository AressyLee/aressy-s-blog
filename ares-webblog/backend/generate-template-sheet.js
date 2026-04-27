/**
 * generate-template-sheet.js
 * 根據 google_sheets_spec.md 產出 Ares Blog CMS 模板試算表 (.xlsx)
 * 執行方式：node backend/generate-template-sheet.js
 * 輸出檔案：backend/Ares_Blog_CMS_Template.xlsx
 */

const XLSX = require("xlsx");
const path = require("path");

// ─── 共用樣式輔助 ──────────────────────────────────────────
function createSheet(headers, rows) {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 設定欄寬
  ws["!cols"] = headers.map((h) => ({
    wch: Math.max(h.length * 2, 18),
  }));

  return ws;
}

// ─── 分頁 1–4：Posts_* ──────────────────────────────────────
function createPostsSheet(prefix, exampleSlug) {
  const headers = [
    "post_id",
    "status",
    "slug",
    "drive_doc_id",
    "last_updated",
    "title",
    "author",
    "summary",
    "cover_image",
  ];

  const example = [
    `${prefix}-001`,
    "已發布",
    exampleSlug,
    "1A2B3C4D5E6F7G8H9I0J",
    "2026-04-20 14:00",
    "在此填寫文章標題",
    "Ares",
    "在此填寫 80 字以內的文章摘要",
    "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80",
  ];

  return createSheet(headers, [example, ["", "", "", "", "", "", "", "", ""]]);
}

// ─── 分頁 5：Homepage ───────────────────────────────────────
function createHomepageSheet() {
  const headers = ["key", "value"];
  const rows = [
    ["hero_image", "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=2564&auto=format&fit=crop"],
    ["carousel_energy_count", "9"],
    ["carousel_science_count", "9"],
    ["carousel_sdgs_count", "9"],
    ["carousel_interview_count", "9"],
    ["video_embed_url", "https://www.youtube.com/embed/m2WlQg1S3tA"],
    ["video_section_visible", "TRUE"],
  ];

  return createSheet(headers, rows);
}

// ─── 分頁 6：News ───────────────────────────────────────────
function createNewsSheet() {
  const headers = [
    "row_type",
    "hero_bg_url",
    "hero_title",
    "hero_date",
    "hero_location",
    "hero_summary",
    "category_list",
    "date",
    "category",
    "title",
    "summary",
    "image_url",
    "link",
    "visible",
  ];

  const heroRow = [
    "hero",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80",
    "2026 台灣永續能源高峰論壇",
    "2026 年 5 月 10 日",
    "台北國際會議中心 B1 大廳",
    "匯聚政府、學界與企業三方視角，共同探討台灣在 2050 淨零路徑下的能源轉型策略與實踐案例。",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];

  const categoriesRow = [
    "categories",
    "",
    "",
    "",
    "",
    "",
    "活動資訊,媒體報導,系統更新",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];

  const items = [
    [
      "item", "", "", "", "", "", "",
      "2026-04-22",
      "活動資訊",
      "能源轉型工作坊：從政策到實踐，一日沉浸課程",
      "本次工作坊將帶領學員深入解析台灣再生能源發展現況，並透過模擬政策情境演練，強化政策分析能力。",
      "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=640&q=80",
      "/",
      "TRUE",
    ],
    [
      "item", "", "", "", "", "", "",
      "2026-04-18",
      "媒體報導",
      "《商業週刊》專訪：Ares 如何用數據讀懂台灣碳市場？",
      "專訪中 Ares 分享了從能源研究所跨入內容創作的心路歷程，以及如何讓複雜政策議題走入大眾視野。",
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=640&q=80",
      "/",
      "TRUE",
    ],
    [
      "item", "", "", "", "", "", "",
      "2026-04-10",
      "系統更新",
      "部落格新功能上線：訂閱即獲每週精選懶人包",
      "即日起訂閱電子報，每週五將收到由 Ares 親自精選的三則能源環境重點新聞與深度解讀。",
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=640&q=80",
      "/",
      "TRUE",
    ]
  ];

  return createSheet(headers, [heroRow, categoriesRow, ...items]);
}

// ─── 分頁 7：About ──────────────────────────────────────────
function createAboutSheet() {
  const headers = ["field", "value"];
  const rows = [
    ["hero_bg_url", "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1600&q=80"],
    ["name", "Ares Chen"],
    ["tagline", "讓永續發展，成為你我都看得懂的語言。"],
    [
      "core_value",
      "我幫助你讀懂能源科技與環境科學，把複雜的數據化為清晰的行動力。不論你是政策制定者、企業主，還是對未來感到好奇的普通人，這裡都有你能帶走的知識。",
    ],
    ["story_html", "<p>2018 年，我在一份環評報告裡讀到一個數字：台灣每年因空污死亡的人數，超過車禍的三倍。那一刻我意識到，問題從來不是「沒有數據」，而是「數據沒有人懂」。</p>\n<p>我花了五年時間在能源政策研究所做分析工作，學會了一件事：最難的不是理解數字，而是把數字說成故事。這個部落格，就是我把這件事當成使命去做的地方。</p>\n<p>2023 年，我開始在 Podcast 分享「5 分鐘讀懂一份永續報告」，沒想到三個月內累積了超過 8,000 名訂閱者。我才確信：這個時代不缺資訊，缺的是有人幫你消化。</p>"],
    ["traits", "數據控・深度閱讀者・永續行動倡議者・偶爾煮咖哩的廚師"],
    ["photo_main_url", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"],
    ["photo_side1_url", "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"],
    ["photo_side2_url", "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80"],
    ["cta_title", "想和我交流？"],
    ["cta_subtitle", "不論是合作提案、讀者提問，還是單純的想法分享，歡迎留下你的訊息。"],
  ];

  return createSheet(headers, rows);
}

// ─── 分頁 8：SiteConfig ─────────────────────────────────────
function createSiteConfigSheet() {
  const headers = ["key", "value"];
  const rows = [
    ["site_title", "Ares's Blog"],
    ["site_description", "以數據驅動且高度自動化的科技與環境科學部落格"],
    ["site_author", "Ares"],
    ["site_url", "https://ares-webblog.web.app"],
    ["og_default_image", "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1600&q=80"],
    ["footer_ig_url", "https://instagram.com/"],
    ["footer_youtube_url", "https://youtube.com/"],
    ["footer_podcast_url", "https://podcasts.apple.com/"],
    ["footer_copyright", "© 2026 Ares Chen. All rights reserved."],
    ["footer_contact_email", "hello@example.com"],
    ["ga_measurement_id", "G-XXXXXXXXXX"],
    ["robots_noindex", "FALSE"],
  ];

  return createSheet(headers, rows);
}

// ─── 組裝 Workbook 並寫出 ───────────────────────────────────
function main() {
  const wb = XLSX.utils.book_new();

  // 分頁 1–4：Posts_*
  XLSX.utils.book_append_sheet(
    wb,
    createPostsSheet("EN", "solar-energy-2025"),
    "Posts_能源科技"
  );
  XLSX.utils.book_append_sheet(
    wb,
    createPostsSheet("EV", "microplastic-pollution"),
    "Posts_環境科學"
  );
  XLSX.utils.book_append_sheet(
    wb,
    createPostsSheet("SD", "circular-economy-practice"),
    "Posts_SDGS"
  );
  XLSX.utils.book_append_sheet(
    wb,
    createPostsSheet("IV", "startup-greentech-interview"),
    "Posts_企業專訪"
  );

  // 分頁 5：Homepage
  XLSX.utils.book_append_sheet(wb, createHomepageSheet(), "Homepage");

  // 分頁 6：News
  XLSX.utils.book_append_sheet(wb, createNewsSheet(), "News");

  // 分頁 7：About
  XLSX.utils.book_append_sheet(wb, createAboutSheet(), "About");

  // 分頁 8：SiteConfig
  XLSX.utils.book_append_sheet(wb, createSiteConfigSheet(), "SiteConfig");

  // 寫出檔案
  const outputPath = path.join(__dirname, "Ares_Blog_CMS_Template.xlsx");
  XLSX.writeFile(wb, outputPath);
  console.log(`已產出模板試算表：${outputPath}`);
}

main();
