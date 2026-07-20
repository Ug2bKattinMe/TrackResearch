import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "rt_tracking_code";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "RT-" + s;
}

export function getCurrentTrackingNumber() {
  return localStorage.getItem(STORAGE_KEY);
}

export async function getOrCreateTrackingNumber() {
  let code = localStorage.getItem(STORAGE_KEY);
  if (code) return code;
  code = generateCode();
  try {
    await base44.entities.TrackingNumber.create({ tracking_code: code });
  } catch (e) {
    // duplicate or transient — keep the local code; it still links submissions
  }
  localStorage.setItem(STORAGE_KEY, code);
  return code;
}