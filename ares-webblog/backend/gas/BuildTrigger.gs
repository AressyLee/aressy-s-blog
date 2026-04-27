/**
 * 發送 POST 至 Cloud Build Webhook
 */
function triggerCloudBuild() {
  const props = PropertiesService.getScriptProperties();
  const webhookUrl = props.getProperty("CLOUD_BUILD_WEBHOOK_URL");
  if (!webhookUrl) {
    console.warn("[BuildTrigger] CLOUD_BUILD_WEBHOOK_URL not set in Script Properties.");
    return;
  }

  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      payload: JSON.stringify({ trigger: "onEdit", timestamp: new Date().toISOString() }),
      muteHttpExceptions: true
    });

    console.log("[BuildTrigger] Response:", response.getResponseCode(), response.getContentText());
  } catch (err) {
    console.error("[BuildTrigger] Failed to trigger build:", err.message);
  }
}
