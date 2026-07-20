import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const SHORT_LABELS = {
  "Baseline — 5-minute workout, no music": "Baseline",
  "Session 2 — 5-minute workout with unfamiliar music": "Unfamiliar",
  "Session 3 — 5-minute workout with favorite motivational song": "Favorite",
};

function shortLabel(label) {
  if (SHORT_LABELS[label]) return SHORT_LABELS[label];
  return label.replace(/^Session \d+ —\s*/i, "").replace(/workout(,| with)?\s*/i, "").trim() || label;
}

function avg(values) {
  const nums = values.filter((v) => v !== null && v !== undefined && v !== "" && !isNaN(Number(v)));
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + Number(b), 0) / nums.length) * 10) / 10;
}

export default function SessionAnalytics({ submissions }) {
  const data = useMemo(() => {
    const groups = {};
    submissions.forEach((s) => {
      const key = s.session_label || "Unlabeled";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s.payload || {});
    });
    return Object.entries(groups).map(([label, items]) => ({
      label: shortLabel(label),
      fullLabel: label,
      "HR before": avg(items.map((p) => p.heart_rate_before)),
      "HR after": avg(items.map((p) => p.heart_rate_after)),
      "Perceived exertion": avg(items.map((p) => p.perceived_exertion)),
      "Mood rating": avg(items.map((p) => p.mood_rating)),
      count: items.length,
    }));
  }, [submissions]);

  if (!data.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="font-heading text-sm font-semibold text-primary">Average heart rate by session</h3>
          <p className="text-xs text-slate-500 mt-0.5">BPM before vs. after the 5-minute workout</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#475569" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "#f8fafc" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="HR before" fill="#94a3b8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="HR after" fill="#0f1f3d" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="font-heading text-sm font-semibold text-primary">Perceived exertion & mood by session</h3>
          <p className="text-xs text-slate-500 mt-0.5">Self-reported scale 1–10</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#475569" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "#f8fafc" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Perceived exertion" fill="#0f1f3d" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Mood rating" fill="#14b8a6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}