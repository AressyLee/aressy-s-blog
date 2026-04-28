/**
 * fetch-google-data.js
 * 透過 Google Apps Script Web App 抓取文章清單，並依序將 Google Docs 轉譯為 Markdown，寫入本地 src/posts/。
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const dotenvPath = path.resolve(__dirname, '../../Frontend/.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
} else {
  console.log("No .env file found, relying on process.env (CI environment expected).");
}

const APPS_SCRIPT_URL = process.env.POSTS_SHEET_URL || "";
const POSTS_DIR = path.resolve(__dirname, '../../Frontend/src/posts');

// Helper to fetch JSON from URL
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  if (!APPS_SCRIPT_URL) {
    console.error("Error: POSTS_SHEET_URL is not defined in environment variables.");
    process.exit(1);
  }

  // Ensure posts directory exists
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  console.log("Fetching posts list from:", APPS_SCRIPT_URL);
  
  try {
    const listResponse = await fetchJson(APPS_SCRIPT_URL);
    if (listResponse.error) {
      throw new Error(listResponse.error);
    }

    const posts = listResponse.data || [];
    console.log(`Found ${posts.length} published posts.`);

    // 取得所有有效的 slug
    const validSlugs = new Set(posts.map(p => p.slug).filter(Boolean));

    // 清理舊文章：如果本地檔案不在有效 slug 列表中，則移至 _archives 目錄
    const ARCHIVE_DIR = path.resolve(__dirname, '../../_archives/unpublished_posts');
    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    }

    const existingFiles = fs.readdirSync(POSTS_DIR);
    for (const file of existingFiles) {
      if (!file.endsWith('.md')) continue;
      if (file === 'TEMPLATE.md') continue; // 保留模板檔案
      
      const fileSlug = file.replace(/\.md$/, '');
      if (!validSlugs.has(fileSlug)) {
        const sourcePath = path.join(POSTS_DIR, file);
        const targetPath = path.join(ARCHIVE_DIR, file);
        fs.renameSync(sourcePath, targetPath);
        console.log(`Moved unpublished post to archives: ${file}`);
      }
    }

    // Extract the base Web App URL without query string
    const baseUrl = APPS_SCRIPT_URL.split('?')[0];

    for (const post of posts) {
      if (!post.slug || !post.drive_doc_id) {
        console.warn(`Skipping post ${post.post_id}: missing slug or drive_doc_id`);
        continue;
      }

      let docId = post.drive_doc_id.trim();
      // 如果使用者貼上的是完整網址，自動擷取 ID
      const urlMatch = docId.match(/[-\w]{25,}/);
      if (urlMatch) {
        docId = urlMatch[0];
      }

      console.log(`Converting Doc ID: ${docId} for slug: ${post.slug}...`);
      const mdUrl = `${baseUrl}?action=doc2md&docId=${docId}`;
      
      const mdResponse = await fetchJson(mdUrl);
      if (mdResponse.error) {
        console.error(`Error converting ${post.slug}:`, mdResponse.error);
        continue;
      }

      const markdownContent = mdResponse.data?.markdown || "";
      
      // 處理封面圖片 URL，將 Google Drive 預覽連結轉換為 lh3 直連格式
      let coverImage = post.cover_image || "";
      if (coverImage.includes("drive.google.com")) {
        const idMatch = coverImage.match(/[-\w]{25,}/);
        if (idMatch) {
          coverImage = `https://lh3.googleusercontent.com/d/${idMatch[0]}`;
        }
      }

      // 處理日期格式，確保只保留 YYYY-MM-DD
      let formattedDate = new Date().toISOString().split('T')[0];
      if (post.last_updated) {
        // 使用 new Date 解析 GAS 傳來的任何日期字串 (包含 "Mon Apr 20 2026...")
        const parsedDate = new Date(post.last_updated);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toISOString().split('T')[0];
        } else {
          // Fallback if parsing fails
          formattedDate = post.last_updated.split(' ')[0].split('T')[0];
        }
      }

      // Inject full frontmatter using metadata from Google Sheets
      let finalContent = `---
layout: layouts/post.njk
title: "${(post.title || "").replace(/"/g, '\\"')}"
date: ${formattedDate}
author: "${(post.author || "Ares").replace(/"/g, '\\"')}"
summary: "${(post.summary || "").replace(/"/g, '\\"')}"
cover_image: "${coverImage}"
tags:
  - ${post.category}
---

${markdownContent}`;

      const filePath = path.join(POSTS_DIR, `${post.slug}.md`);
      fs.writeFileSync(filePath, finalContent, 'utf8');
      console.log(`Successfully wrote ${filePath}`);
    }

    console.log("Finished generating all markdown posts.");
    process.exit(0);
  } catch (error) {
    console.error("Error fetching data:", error);
    process.exit(1);
  }
}

main();
