import browser from "webextension-polyfill";
import { getTodayTimestamp } from "./utils/date";

browser.runtime.onInstalled.addListener(() => {
  console.log("Happy Message Extension installed!");
});

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // console.log("🧠 Incoming URL:", details.url);
    const url = new URL(details.url);
    const urlPath = url.pathname;

    const match = urlPath.match(/\/customer\/(\d+)\/employee\/(\d+)/);
    if (match) {
      const customerId = match[1];
      const employeeId = match[2];
      // console.log(`✅ Extracted Customer ID: ${customerId}, Employee ID: ${employeeId}`);

      chrome.storage.local.set({
        customerId,
        employeeId,
        apiHeadersArray: details.requestHeaders
      }, 
      () => {
        console.log("💾 Data saved to storage.");
      });
    } else {
      console.log("❌ No match in URL:", urlPath);
    }
  },
  {
    urls: ["*://*.helixbeat.com/*"],
    types: ["xmlhttprequest"]
  },
  ["requestHeaders", "extraHeaders"]
);

function fetchBreakTimeData() {
  console.log("here")
  const todayTimestamp = getTodayTimestamp();
  
  chrome.storage.local.get(["customerId", "employeeId", "apiHeadersArray"], (data) => {
    if (!data.customerId || !data.employeeId || !data.apiHeadersArray) {
      console.error("Missing required data for API request.");
      return;
    }
    
    // Construct the break-time URL with the stored IDs and today's timestamp
    const breakTimeUrl = `https://synergyapi.helixbeat.com/customer/${data.customerId}/employee/${data.employeeId}/break-time?employeeId=${data.employeeId}&startDate=${todayTimestamp}&endDate=${todayTimestamp}&isEmployee=true`;
    
    console.log("Attempting to fetch from:", breakTimeUrl);
    
    // Create headers object in the format expected by fetch
    const headers = new Headers();
    data.apiHeadersArray.forEach(header => {
      // Skip the 'content-length' header as it will be set automatically by fetch
      if (header.name.toLowerCase() !== 'content-length') {
        headers.append(header.name, header.value);
      }
    });
    
    fetch(breakTimeUrl, {
      method: "GET",
      headers: headers,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        console.log("Fetched Break Time API Response:", result);
        // Send updated data to popup.ts
        chrome.runtime.sendMessage({ action: "updatePopup", data: result });
      })
      .catch((error) => {
        console.error("Error fetching Break Time API:", error);
      });
  });
}

// Check for break time data every hour
setInterval(fetchBreakTimeData, 3600000);

// Handle manual refresh requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchAPIData") {
    fetchBreakTimeData();
    sendResponse({ success: true });
  }
});