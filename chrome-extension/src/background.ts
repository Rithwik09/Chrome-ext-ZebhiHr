import browser from "webextension-polyfill";
import { getTodayTimestamp } from "./utils/date";
// import chrome from "chrome"; // Not needed, chrome is available globally in the extension environment

browser.runtime.onInstalled.addListener(() => {
  console.log("Happy Message Extension installed!");
});

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    console.log("Captured request details:", details);

    const todayTimestamp = getTodayTimestamp();
    const url = new URL(details.url);

    // Check if the URL contains "break-time" AND today's date in startDate or endDate
    if (
      url.pathname.includes("break-time") &&
      (url.searchParams.get("startDate") === todayTimestamp ||
        url.searchParams.get("endDate") === todayTimestamp)
    ) {
      const requestHeaders: { [key: string]: string } = {};
      for (const header of (details as any).requestHeaders) {
        requestHeaders[header.name] = header.value;
      }

      // Store only if it matches today's date
      chrome.storage.local.set({
        apiUrl: details.url,
        apiHeaders: requestHeaders
      });

      console.log("Stored API details:", { url: details.url, headers: requestHeaders });
    }
  },
  { urls: ["https://api.zebihr.com/*"] },
  ["requestHeaders", "extraHeaders"]
);


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("clcikedon came here!!");

  if (message.action === "fetchAPIData") {
    chrome.storage.local.get(["apiUrl", "apiHeaders"], (data) => {
      if (!data.apiUrl || !data.apiHeaders) {
        console.error("No API details found.");
        sendResponse({ error: "No API details found." });
        return;
      }

      // Fetch the API
      fetch(data.apiUrl, {
        method: "GET",
        headers: data.apiHeaders
      })
        .then((response) => response.json())
        .then((result) => {
          console.log("Fetched API Response:", result);
          sendResponse({ success: true, data: result });
        })
        .catch((error) => {
          console.error("Error fetching API:", error);
          sendResponse({ error: "Failed to fetch API" });
        });
    });

    return true; // ✅ Important! Keeps the messaging channel open for async sendResponse
  }
});