import '@fortawesome/fontawesome-free/css/all.min.css';

// ------------------------ Time Utilities ------------------------

function getTimeDifferenceInSeconds(start: string, end: string): number {
  const [startH, startM, startS] = start.split(":").map(Number);
  const [endH, endM, endS] = end.split(":").map(Number);
  return (endH * 3600 + endM * 60 + endS) - (startH * 3600 + startM * 60 + startS);
}

function to12HourFormat(time24: string): string {
  let [h, m, s] = time24.split(":").map(Number);

  const period = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;

  return `${String(h12).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} ${period}`;
}

function to24HourSeconds(time24: string): number {
  const [h, m, s] = time24.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function secondsToHMS(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ------------------------ Work Settings ------------------------

const requiredWorkHours = 8.5; // clean & simple
let timeLeftSeconds = 0;

// ------------------------ Punch Parsing & Work Calculation ------------------------

function parsePunches(punches: string) {
  return punches.split(",").map(p => {
    const parts = p.split(":");
    return {
      time: parts.slice(0, 3).join(":"), // HH:mm:ss
      type: parts[3] // in/out
    };
  });
}

function calculateTotalWorkSeconds(punches: string): number {
  const punchList = parsePunches(punches);

  let total = 0;
  let lastIn: string | null = null;

  for (const p of punchList) {
    if (p.type === "in") {
      lastIn = p.time;
    } else if (p.type === "out" && lastIn) {
      total += getTimeDifferenceInSeconds(lastIn, p.time);
      lastIn = null;
    }
  }
  return total;
}

// ------------------------ Main Calculations ------------------------

function calculateOutTime24(punches: string): string {
  const punchList = parsePunches(punches);
  const lastPunchIn = punchList[punchList.length - 1].time;

  const totalWorkedSeconds = calculateTotalWorkSeconds(punches);
  const requiredSeconds = requiredWorkHours * 3600;

  const remainingSeconds = requiredSeconds - totalWorkedSeconds;

  if (remainingSeconds <= 0) {
    return "00:00:00"; // technically done
  }

  const lastInSec = to24HourSeconds(lastPunchIn);
  const outTimeSec = lastInSec + remainingSeconds;

  const h = Math.floor((outTimeSec / 3600) % 24);
  const m = Math.floor((outTimeSec % 3600) / 60);
  const s = Math.floor(outTimeSec % 60);

  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function calculateTimeLeftFromNow(outTime24: string): number {
  const now = new Date();
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const outSec = to24HourSeconds(outTime24);

  return Math.max(outSec - nowSec, 0);
}

// ------------------------ DOM Load Fill ------------------------

document.addEventListener("DOMContentLoaded", () => {
  const outTime = localStorage.getItem("outTime24");
  const breakTime = localStorage.getItem("breakTime");
  const inTime = localStorage.getItem("inTime");

  if (outTime) {
    document.getElementById("outTimeValue")!.textContent = to12HourFormat(outTime);
  }

  if (breakTime)
    document.querySelector("h2:nth-of-type(2)")!.innerHTML = `Break-Time: <strong>${breakTime}</strong>`;

  if (inTime)
    document.querySelector("h2:nth-of-type(1)")!.innerHTML = `Clock In-Time: <strong>${inTime}</strong>`;
});

// ------------------------ Update UI From Background ------------------------

function updatePopupUI(data: any) {
  if (!data[0]) return;

  const breakTime = data[0].breakHrs;
  const inTime = data[0].inTime;
  const punches = data[0].punches;

  const outTime24 = calculateOutTime24(punches);
  timeLeftSeconds = calculateTimeLeftFromNow(outTime24);

  document.querySelector("h2:nth-of-type(1)")!.innerHTML = `Clock In-Time: <strong>${inTime}</strong>`;
  document.querySelector("h2:nth-of-type(2)")!.innerHTML = `Break-Time: <strong>${breakTime}</strong>`;
  document.getElementById("outTimeValue")!.textContent = to12HourFormat(outTime24);

  // store
  localStorage.setItem("inTime", inTime);
  localStorage.setItem("breakTime", breakTime);
  localStorage.setItem("outTime24", outTime24);
  localStorage.setItem("timeLeftSeconds", String(timeLeftSeconds));
  localStorage.setItem("lastPunches", punches);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "updatePopup") updatePopupUI(msg.data);
});

// ------------------------ Manual Fetch ------------------------

document.getElementById("fetchData")?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "fetchAPIData" });
});

// ------------------------ Flip Card (Display Only) ------------------------

const outTimeCard = document.getElementById("outTimeCard");

outTimeCard?.addEventListener("click", () => {
  outTimeCard.classList.toggle("flipped");

  if (outTimeCard.classList.contains("flipped")) {
    const stored = localStorage.getItem("timeLeftSeconds");
    const remaining = stored ? parseInt(stored) : timeLeftSeconds;

    const lbl = document.getElementById("timeLeftLabel");
    if (lbl) lbl.textContent = `Time Left: ${secondsToHMS(remaining)}`;
  }
});
