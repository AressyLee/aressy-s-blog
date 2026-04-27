module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addFilter("dateFilter", function(dateObj) {
    if (!dateObj) return "";
    let d = new Date(dateObj);
    let y = d.getFullYear();
    let m = ("0" + (d.getMonth() + 1)).slice(-2);
    let day = ("0" + d.getDate()).slice(-2);
    return `${y}/${m}/${day}`;
  });

  // 自訂 posts collection：只包含 src/posts/ 下的真實文章，排除 TEMPLATE.md
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .filter(item => !item.inputPath.includes("TEMPLATE.md"))
      .sort((a, b) => a.date - b.date);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
