require('dotenv').config();
const EleventyFetch = require("@11ty/eleventy-fetch");

const APPS_SCRIPT_URL = process.env.HOMEPAGE_SHEET_URL || "";

const FALLBACK = {
  hero_image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=2564&auto=format&fit=crop",
  video_embed_url: "https://www.youtube.com/embed/m2WlQg1S3tA",
  carousel_energy_count: 9,
  carousel_science_count: 9,
  carousel_sdgs_count: 9,
  carousel_interview_count: 9,
  video_section_visible: "TRUE"
};

/**
 * 將任何 YouTube URL 格式統一轉為 embed 格式
 * 支援：youtu.be/ID、youtube.com/watch?v=ID、youtube.com/embed/ID
 */
function toYoutubeEmbedUrl(url) {
  if (!url) return "";
  // 已經是 embed 格式，直接回傳（只保留 video ID，去除多餘參數）
  const embedMatch = url.match(/youtube\.com\/embed\/([\w-]+)/);
  if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;
  // youtu.be 短連結：youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // 完整 watch 連結：youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  // 無法識別，原樣回傳
  return url;
}

module.exports = async function () {
  if (!APPS_SCRIPT_URL) {
    return FALLBACK;
  }

  try {
    const response = await EleventyFetch(APPS_SCRIPT_URL, {
      duration: "0s",
      type: "json"
    });

    const data = Object.keys(response.data || {}).length ? response.data : FALLBACK;

    // 確保 video_embed_url 一定是 embed 格式
    if (data.video_embed_url) {
      data.video_embed_url = toYoutubeEmbedUrl(data.video_embed_url);
    }

    return data;
  } catch (err) {
    console.warn("[homepageData] Fetch failed, using fallback:", err.message);
    return FALLBACK;
  }
};
