require('dotenv').config();
const EleventyFetch = require("@11ty/eleventy-fetch");

const APPS_SCRIPT_URL = process.env.SITECONFIG_SHEET_URL || "";

const FALLBACK = {
  title: "Ares's Blog",
  description: "以數據驅動且高度自動化的科技與環境科學部落格",
  author: "Ares",
  url: "https://ares-webblog.web.app"
};

module.exports = async function () {
  if (!APPS_SCRIPT_URL) {
    return FALLBACK;
  }

  try {
    const response = await EleventyFetch(APPS_SCRIPT_URL, {
      duration: "0s",
      type: "json"
    });

    const d = response.data || {};

    return {
      title: d.site_title || FALLBACK.title,
      description: d.site_description || FALLBACK.description,
      author: d.site_author || FALLBACK.author,
      url: d.site_url || FALLBACK.url,
      ...d // 把其餘欄位（例如 footer_ig_url 等）也保留，方便日後擴充
    };
  } catch (err) {
    console.warn("[siteData] Fetch failed, using fallback:", err.message);
    return FALLBACK;
  }
};
