export function getTodayTimestamp(): string {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00 UTC
    return today.getTime().toString();
  }
  