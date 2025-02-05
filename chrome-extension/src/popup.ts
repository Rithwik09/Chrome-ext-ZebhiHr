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

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:${String(newSeconds).padStart(2, "0")}`;
}
function calculateOutTime(punches: string, requiredWorkHours: number) {
  const punchList = punches.split(",").map(p => {
    const [time, type] = p.split(":");
    return { time, type };
  });
  console.log("Punch List:", punchList);
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



document.getElementById("happyButton")?.addEventListener("click", () => {
  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.textContent = "🎉 You are awesome! 🎉";
  }
});

document.getElementById("fetchData")?.addEventListener("click", () => {
  console.log("Clicked on fetchData");
  chrome.runtime.sendMessage({ action: "fetchAPIData" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message:", chrome.runtime.lastError);
      return;
    }
    if (response?.error) {
      console.error("Error fetching data:", response.error);
      alert("Error fetching data. Check console.");
    } else {
      console.log("Captured Data:", response);
       console.log("hi",response.data[0]);
       console.log("hi",response.data[0].inTime);
       console.log("hi",response.data[0].punches);
      // alert(JSON.stringify(response.data, null, 2));
      if(response.data[0] && response.data[0].punches) {
       const punches  = response.data[0].punches;
      const calculatedoutTime = calculateOutTime(punches, 8.5);

       alert(calculatedoutTime);
      }
    }
  });
});
