export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getCurrentTime24 = (date = new Date()) => {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

export const normalizeTime = (time: string): string => {
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  const [timePart, period = "AM"] = time.trim().split(" ");
  const [hourPart, minute = "00"] = timePart.split(":");
  let hour = Number(hourPart);
  if (Number.isNaN(hour)) return time;
  if (period.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, "0")}:${minute.padStart(2, "0")}`;
};
export const to24Hour = normalizeTime;

export const toDisplayTime = (time: string): string => {
  const normalized = to24Hour(time);
  const [hourStr, minute = "00"] = normalized.split(":");
  const hour = Number(hourStr);
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
};