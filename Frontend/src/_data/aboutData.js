require('dotenv').config();
/**
 * aboutData.js
 * 透過 eleventy-fetch 從 Google Apps Script Web App URL 抓取「關於我」頁面資料。
 * 若尚未部署 Apps Script，回傳靜態 fallback 資料供開發預覽使用。
 *
 * Google Sheet 欄位格式（分頁名稱：About）：
 * field | value
 * -------------------------
 * hero_bg_url         | https://...
 * name                | Ares Chen
 * tagline             | 讓永續發展，成為你我都看得懂的語言。
 * core_value          | 我幫助你讀懂能源與環境科學，把複雜的數據化為清晰的行動力。
 * story_html          | <p>我的故事內文（可含 HTML）</p>
 * traits              | 熱愛數據・深度閱讀・永續行動者（以「・」分隔）
 * photo_main_url      | https://...
 * photo_side1_url     | https://...
 * photo_side2_url     | https://...
 * cta_title           | 想和我交流？
 * cta_subtitle        | 不論是合作提案、讀者提問，還是單純的想法分享，我都很歡迎。
 */

const EleventyFetch = require("@11ty/eleventy-fetch");

// 將此處替換為你的 Apps Script Web App URL
const APPS_SCRIPT_URL = process.env.ABOUT_SHEET_URL || "";

const FALLBACK = {
  hero_bg_url: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1600&q=80",
  name: "Ares Chen",
  tagline: "讓永續發展，成為你我都看得懂的語言。",
  core_value: "我幫助你讀懂能源科技與環境科學，把複雜的數據化為清晰的行動力。不論你是政策制定者、企業主，還是對未來感到好奇的普通人，這裡都有你能帶走的知識。",
  story_html: `
    <p>2018 年，我在一份環評報告裡讀到一個數字：台灣每年因空污死亡的人數，超過車禍的三倍。那一刻我意識到，問題從來不是「沒有數據」，而是「數據沒有人懂」。</p>
    <p>我花了五年時間在能源政策研究所做分析工作，學會了一件事：最難的不是理解數字，而是把數字說成故事。這個部落格，就是我把這件事當成使命去做的地方。</p>
    <p>2023 年，我開始在 Podcast 分享「5 分鐘讀懂一份永續報告」，沒想到三個月內累積了超過 8,000 名訂閱者。我才確信：這個時代不缺資訊，缺的是有人幫你消化。</p>
  `,
  traits: "數據控・深度閱讀者・永續行動倡議者・偶爾煮咖哩的廚師",
  photo_main_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  photo_side1_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  photo_side2_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80",
  cta_title: "想和我交流？",
  cta_subtitle: "不論是合作提案、讀者提問，還是單純的想法分享，歡迎留下你的訊息。"
};

module.exports = async function () {
  if (!APPS_SCRIPT_URL) {
    console.log("[aboutData] No ABOUT_SHEET_URL set, using fallback data.");
    return FALLBACK;
  }

  try {
    const response = await EleventyFetch(APPS_SCRIPT_URL, {
      duration: "0s",
      type: "json"
    });

    // 新版 GAS 回傳格式：{ data: { hero_bg_url: "...", name: "...", ... } }
    return Object.keys(response.data || {}).length ? response.data : FALLBACK;
  } catch (err) {
    console.warn("[aboutData] Fetch failed, using fallback:", err.message);
    return FALLBACK;
  }
};
