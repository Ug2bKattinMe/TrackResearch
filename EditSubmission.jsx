// Heuristic quality checks for a submission. Returns an array of flag strings
// (empty array = submission passes all checks).
export function validateSubmission(s) {
  const flags = [];
  const p = s.payload || {};

  // Heart rate may be a single number (max) or a "min-max" range string.
  const parseHR = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const str = String(v).trim();
    const m = str.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) return { min: Number(m[1]), max: Number(m[2]) };
    const n = Number(str);
    return isNaN(n) ? null : { min: n, max: n };
  };

  const hrBefore = parseHR(p.heart_rate_before);
  if (hrBefore == null) flags.push("Missing HR before");
  else if (hrBefore.min < 30 || hrBefore.max > 220) flags.push("HR before out of range");

  const sets = p.sets || {};
  const setNames = { baseline: "Baseline", unfamiliar: "Unfamiliar", favorite: "Favorite" };

  const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

  for (const key of Object.keys(setNames)) {
    const set = sets[key] || {};
    const hrAfter = parseHR(set.heart_rate_after);
    const ex = num(set.perceived_exertion);
    const mood = num(set.mood_rating);
    const label = setNames[key];

    if (hrAfter != null && (hrAfter.min < 30 || hrAfter.max > 220)) flags.push(`${label}: HR after out of range`);
    if (ex != null && (ex < 1 || ex > 10)) flags.push(`${label}: Exertion out of range`);
    if (mood != null && (mood < 1 || mood > 10)) flags.push(`${label}: Mood out of range`);

    if (hrAfter == null) flags.push(`${label}: Missing HR after`);
    if (ex == null) flags.push(`${label}: Missing exertion`);
  }

  return flags;
}