export function parseTimeInput(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  const ampm = s.endsWith("am") || s.endsWith("pm") ? s.slice(-2) : null;
  const timePart = ampm ? s.slice(0, -2).trim() : s;
  const [hStr, mStr] = timePart.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr !== undefined ? parseInt(mStr, 10) : 0;
  if (isNaN(h) || isNaN(m) || m < 0 || m > 59) return null;
  if (ampm === "pm" && h !== 12) h += 12;
  else if (ampm === "am" && h === 12) h = 0;
  else if (!ampm && h >= 1 && h <= 11) h += 12;
  if (h < 0 || h > 23) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const PRESETS = [
  { label: "2:30", start: "2:30pm" },
  { label: "3:00", start: "3:00pm" },
  { label: "3:30", start: "3:30pm" },
  { label: "4:00", start: "4:00pm" },
];
