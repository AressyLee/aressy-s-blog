require('dotenv').config();
/**
 * newsData.js
 * 透過 eleventy-fetch 從 Google Apps Script Web App URL 抓取「最新消息」頁面資料。
 * 若尚未部署 Apps Script，回傳靜態 fallback 資料供開發預覽使用。
 *
 * Google Sheet 欄位格式（分頁名稱：News）：
 * date | category | title | summary | image_url | link | is_hero
 * -----------------------------------------------------------------------
 * 2026-04-20 | 活動資訊 | 永續論壇開幕 | 今年最大... | https://... | /news/... | TRUE
 *
 * is_hero = TRUE 的第一筆資料將渲染為 Hero 區塊（hero_title、hero_date、hero_location、hero_summary 由 hero_* 欄位提供）
 *
 * 額外 Hero 專屬欄位（可於同一分頁末端補充）：
 * hero_bg_url   | https://...
 * hero_date     | 2026 年 5 月 10 日
 * hero_location | 台北國際會議中心 B1 大廳
 */

const EleventyFetch = require("@11ty/eleventy-fetch");

const APPS_SCRIPT_URL = process.env.NEWS_SHEET_URL || "";

const FALLBACK_HERO = {
  hero_bg_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80",
  hero_title: "2026 台灣永續能源高峰論壇",
  hero_date: "2026 年 5 月 10 日",
  hero_location: "台北國際會議中心 B1 大廳",
  hero_summary: "匯聚政府、學界與企業三方視角，共同探討台灣在 2050 淨零路徑下的能源轉型策略與實踐案例。"
};

const FALLBACK_CATEGORIES = ["活動資訊", "媒體報導", "系統更新"];

const FALLBACK_ITEMS = [
  {
    date: "2026-04-22",
    category: "活動資訊",
    title: "能源轉型工作坊：從政策到實踐，一日沉浸課程",
    summary: "本次工作坊將帶領學員深入解析台灣再生能源發展現況，並透過模擬政策情境演練，強化政策分析能力。",
    image_url: "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=640&q=80",
    link: "#"
  },
  {
    date: "2026-04-18",
    category: "媒體報導",
    title: "《商業週刊》專訪：Ares 如何用數據讀懂台灣碳市場？",
    summary: "專訪中 Ares 分享了從能源研究所跨入內容創作的心路歷程，以及如何讓複雜政策議題走入大眾視野。",
    image_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=640&q=80",
    link: "#"
  },
  {
    date: "2026-04-10",
    category: "系統更新",
    title: "部落格新功能上線：訂閱即獲每週精選懶人包",
    summary: "即日起訂閱電子報，每週五將收到由 Ares 親自精選的三則能源環境重點新聞與深度解讀。",
    image_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=640&q=80",
    link: "#"
  },
  {
    date: "2026-03-28",
    category: "活動資訊",
    title: "SDGs 青年論壇｜Ares 受邀擔任主題講者",
    summary: "本次論壇以「Z 世代的永續行動力」為主軸，Ares 將分享如何透過資料視覺化推動公眾氣候素養。",
    image_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=640&q=80",
    link: "#"
  },
  {
    date: "2026-03-15",
    category: "媒體報導",
    title: "Podcast 「能源白話文」累積突破 3 萬訂閱",
    summary: "自 2024 年創立以來，節目以每週一集的節奏持續更新，內容涵蓋能源政策、氣候科學與永續投資。",
    image_url: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=640&q=80",
    link: "#"
  },
  {
    date: "2026-02-20",
    category: "系統更新",
    title: "站內搜尋功能正式上線，快速找到你需要的分析文章",
    summary: "透過全文索引技術，讀者現在可以直接在搜尋欄輸入關鍵字，精準定位站內任何一篇深度報導。",
    image_url: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=640&q=80",
    link: "#"
  }
];

module.exports = async function () {
  if (!APPS_SCRIPT_URL) {
    console.log("[newsData] No NEWS_SHEET_URL set, using fallback data.");
    return { hero: FALLBACK_HERO, categories: FALLBACK_CATEGORIES, items: FALLBACK_ITEMS };
  }

  try {
    const response = await EleventyFetch(APPS_SCRIPT_URL, {
      duration: "0s",
      type: "json"
    });

    // 新版 GAS 回傳格式：{ data: { hero: {...}, categories: [...], items: [...] } }
    return {
      hero: response.data?.hero || FALLBACK_HERO,
      categories: response.data?.categories || FALLBACK_CATEGORIES,
      items: response.data?.items || FALLBACK_ITEMS
    };
  } catch (err) {
    console.warn("[newsData] Fetch failed, using fallback:", err.message);
    return { hero: FALLBACK_HERO, categories: FALLBACK_CATEGORIES, items: FALLBACK_ITEMS };
  }
};
