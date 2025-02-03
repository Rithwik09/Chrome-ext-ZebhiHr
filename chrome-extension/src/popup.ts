// import browser from "webextension-polyfill";
document.getElementById("happyButton")?.addEventListener("click", () => {
  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.textContent = "🎉 You are awesome! 🎉";
  }
});
