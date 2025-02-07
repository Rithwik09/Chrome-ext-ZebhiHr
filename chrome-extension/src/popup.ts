function getTimeDifferenceInSeconds(start: string, end: string): number {
  const [startH, startM, startS] = start.split(":").map(Number);
  const [endH, endM, endS] = end.split(":").map(Number);

  return (endH * 3600 + endM * 60 + endS) - (startH * 3600 + startM * 60 + startS);
}

function addSecondsToTime(time: string, secondsToAdd: number): string {
  let [hours, minutes, seconds] = time.split(":").map(Number);
  let totalSeconds = hours * 3600 + minutes * 60 + seconds + secondsToAdd;

  let newHours = Math.floor(totalSeconds / 3600) % 24;
  let newMinutes = Math.floor((totalSeconds % 3600) / 60);
  let newSeconds = totalSeconds % 60;

  return convertTo12HourFormat(
    `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:${String(newSeconds).padStart(2, "0")}`
  );
}

function convertTo12HourFormat(time24: string): string {
  let [hours, minutes, seconds] = time24.split(":").map(Number);
  let period = hours >= 12 ? "PM" : "AM";

  let hours12 = hours % 12;
  if (hours12 === 0) hours12 = 12; // 0 should be converted to 12 AM

  return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${period}`;
}

const punches: string = "10:42:38:in,12:17:49:out,12:20:32:in,12:40:54:out,13:02:19:in"; 
const requiredWorkHours: number = 8.5;

function calculateOutTime(punches: string, requiredWorkHours: number): string {
  console.log("Calculating out time...");
  
  const punchList = punches.split(",").map(p => {
    const parts = p.split(":");
    const time = parts.slice(0, 3).join(":"); // Extract the first three parts as time
    const type = parts[3]; // The last part is the type (in/out)
    return { time, type };
  });

  let totalWorkSeconds = 0;
  let lastInTime: string | null = null;

  for (let i = 0; i < punchList.length; i++) {
    if (punchList[i].type === "in") {
      lastInTime = punchList[i].time;
    } else if (punchList[i].type === "out" && lastInTime) {
      totalWorkSeconds += getTimeDifferenceInSeconds(lastInTime, punchList[i].time);
      lastInTime = null;
    }
  }

  const requiredSeconds = requiredWorkHours * 3600;
  const remainingSeconds = requiredSeconds - totalWorkSeconds;

  if (remainingSeconds <= 0) {
    return "Work hours already completed!";
  }

  // Calculate expected out time
  const lastPunchIn = punchList[punchList.length - 1].time;
  return addSecondsToTime(lastPunchIn, remainingSeconds);
}

document.addEventListener("DOMContentLoaded", () => {
  // Load stored values when the popup is opened
  const storedBreakTime = localStorage.getItem("breakTime");
  const storedOutTime = localStorage.getItem("calculatedOutTime");
  const storedInTime = localStorage.getItem("inTime");

  if (storedOutTime) {
    const outTimeElement = document.querySelector("h2:nth-of-type(3)");
    if (outTimeElement) {
      outTimeElement.innerHTML = `Clock Out-Time: <strong>${storedOutTime}</strong>`;
    }
  }

  if (storedBreakTime) {
    const breakTimeElement = document.querySelector("h2:nth-of-type(2)");
    if (breakTimeElement) {
      breakTimeElement.innerHTML = `Break-Time: <strong>${storedBreakTime}</strong>`;
    }
  }

  if (storedInTime) {
    const inTimeElement = document.querySelector("h2:nth-of-type(1)");
    if (inTimeElement) {
      inTimeElement.innerHTML = `Clock In-Time: <strong>${storedInTime}</strong>`;
    }
  }
});

// document.getElementById("fetchData")?.addEventListener("click", () => {
//   console.log("Clicked on fetchData");

//   chrome.runtime.sendMessage({ action: "fetchAPIData" }, (response) => {
//     if (chrome.runtime.lastError) {
//       console.error("Error sending message:", chrome.runtime.lastError);
//       return;
//     }

//     if (response?.error) {
//       console.error("Error fetching data:", response.error);
//       alert("Error fetching data. Check console.");
//     } else {
//       console.log("Captured Data:", response);

//       if (response.data[0]) {
//         const breakTime = response.data[0].breakHrs;
//         const inTime = response.data[0].inTime;
//         const punches = response.data[0].punches;
//         const calculatedOutTime = calculateOutTime(punches, 8.5);

//         const inTimeElement = document.querySelector("h2:nth-of-type(1)");
//         if (inTimeElement) {
//           inTimeElement.innerHTML = `Clock In-Time: <strong>${inTime}</strong>`;
//           localStorage.setItem("inTime", inTime);
//         }

//         const breakTimeElement = document.querySelector("h2:nth-of-type(2)");
//         if (breakTimeElement) {
//           breakTimeElement.innerHTML = `Break-Time: <strong>${breakTime}</strong>`;
//           localStorage.setItem("breakTime", breakTime);
//         }

//         const outTimeElement = document.querySelector("h2:nth-of-type(3)");
//         if (outTimeElement) {
//           outTimeElement.innerHTML = `Clock Out-Time: <strong>${calculatedOutTime}</strong>`;
//           localStorage.setItem("calculatedOutTime", calculatedOutTime);
//         }

//         const punchList = punches.split(",");
//         const lastPunch = punchList[punchList.length - 1];
//         const lastPunchType = lastPunch.split(":").pop(); // "in" or "out"

//         const statusIcon = document.getElementById("statusIcon") as HTMLImageElement;
//         if (statusIcon) {
//           const checkedInIcon = chrome.runtime.getURL("Boxing-gloves.png");
//           const checkedOutIcon = chrome.runtime.getURL("bag.png");

//           statusIcon.src = lastPunchType === "in" ? checkedInIcon : checkedOutIcon;
//           statusIcon.alt = lastPunchType === "in" ? "Checked In" : "Checked Out";

//             statusIcon.classList.remove("show"); // Remove class to restart animation
//            void statusIcon.offsetWidth; // Trigger reflow to restart animation
//            statusIcon.classList.add("show");
//         }
//       }
//     }
//   });
// });

function updatePopupUI(data: any) {
  console.log("Updating popup with new data:", data);

  if (data[0]) {
    const breakTime = data[0].breakHrs;
    const inTime = data[0].inTime;
    const punches = data[0].punches;
    const calculatedOutTime = calculateOutTime(punches, 8.5); 
    const punchList = punches.split(",");
    const lastPunch = punchList[punchList.length - 1];
    const lastPunchType = lastPunch.split(":").pop(); 

    document.querySelector("h2:nth-of-type(1)")!.innerHTML = `Clock In-Time: <strong>${inTime}</strong>`;
    document.querySelector("h2:nth-of-type(2)")!.innerHTML = `Break-Time: <strong>${breakTime}</strong>`;
    document.querySelector("h2:nth-of-type(3)")!.innerHTML = `Clock Out-Time: <strong>${calculatedOutTime}</strong>`;

    localStorage.setItem("inTime", inTime);
    localStorage.setItem("breakTime", breakTime);
    localStorage.setItem("calculatedOutTime", calculatedOutTime);

    const statusIcon = document.getElementById("statusIcon") as HTMLImageElement;
            if (statusIcon) {
              const checkedInIcon = chrome.runtime.getURL("Boxing-gloves.png");
              const checkedOutIcon = chrome.runtime.getURL("bag.png");
    
              statusIcon.src = lastPunchType === "in" ? checkedInIcon : checkedOutIcon;
              statusIcon.alt = lastPunchType === "in" ? "Checked In" : "Checked Out";
    
                statusIcon.classList.remove("show"); // Remove class to restart animation
               void statusIcon.offsetWidth; // Trigger reflow to restart animation
               statusIcon.classList.add("show");
            }
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updatePopup") {
    updatePopupUI(message.data);
  }
});

document.getElementById("fetchData")?.addEventListener("click", () => {
  console.log("Manual fetch triggered");

  chrome.runtime.sendMessage({ action: "fetchAPIData" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message:", chrome.runtime.lastError);
      return;
    }

    if (response?.success) {
      console.log("Manual fetch request sent successfully.");
    } else {
      console.error("Failed to fetch data manually.");
    }
  });
});

