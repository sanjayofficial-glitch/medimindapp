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

/**
 * Normalizes time strings to HH:mm format for consistent comparison.
 * Handles HH:mm:ss, HH:mm, and "HH:mm AM/PM" formats.
 */
export const normalizeTime = (time: string | null | undefined): string => {
  if (!time) return "";
  
  // Remove seconds if present (HH:mm:ss -> HH:mm)
  const timeOnly = time.split(' ')[0];
  const parts = timeOnly.split(':');
  
  if (parts.length >= 2) {
    let hour = parseInt(parts[0]);
    const minute = parts[1];
    const isPM = time.toUpperCase().includes("PM");
    const isAM = time.toUpperCase().includes("AM");
    
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    
    return `${hour.toString().padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }
  
  return time;
};