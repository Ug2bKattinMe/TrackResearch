import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function extract(subs, key) {
  return subs
    .map((s) => Number(s.payload?.[key]))
    .filter((v) => v != null && !isNaN(v));
}

function histogram(values, binSize, start, end) {
  const bins = [];
  for (let e = start; e < end; e += binSize) {
    bins.push({ label: `${e}-${e + binSize}`, count: 0 });
  }
  values.forEach((v) => {
    let idx = Math.floor((v - start) / binSize);
    if (idx < 0) idx = 0;
    if (idx >= bins.length) idx = bins.length - 1;
    bins[idx].count += 1;
  });
  return bins;
}

function discrete(values, min, max) {
  const bins = [];
  for (let i = min; i <= max; i++) bins.push({ label: String(i), count: 0 });
  values.forEach((v) => {
    if (v >= min && v <= max) bins[v - min].count += 1;
  });
  return bins;
}

function stats(values) {
  if (!values.length) return { n: 0, mean: "—", min: "—", max: "—" };
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    n: values.length,
    mean: (sum / values.length).toFixed(1),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function StatCard({ title, s }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-lg font-semibold text-primary mt-0.5">{s.mean}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">
        n={s.n} · min {s.min} · max {s.max}
      </div>
    </div>
  );
}

function Chart({ title, data, color }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={48} />
          <YAxis allowDecimals tick={{ fontSize: 10 }} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} />
          <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ParticipantTrends({ submissions }) {
  const data = useMemo(() => {
    const hrBefore = extract(submissions, "heart_rate_before");
    const hrAfter = extract(submissions, "heart_rate_after");
    const ex = extract(submissions, "perceived_exertion");
    const mood = extract(submissions, "mood_rating");
    return {
      hrBefore,
      hrAfter,
      ex,
      mood,
      hrAfterHist: histogram(hrAfter, 20, 40, 200),
      hrBeforeHist: histogram(hrBefore, 20, 40, 200),
      exDist: discrete(ex, 1, 10),
      moodDist: discrete(mood, 1, 10),
    };
  }, [submissions]);

  if (!submissions.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        No submissions to visualize yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="HR before (mean)" s={stats(data.hrBefore)} />
        <StatCard title="HR after (mean)" s={stats(data.hrAfter)} />
        <StatCard title="Exertion (mean)" s={stats(data.ex)} />
        <StatCard title="Mood (mean)" s={stats(data.mood)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Chart title="Heart rate after — distribution" data={data.hrAfterHist} color="#0d9488" />
        <Chart title="Heart rate before — distribution" data={data.hrBeforeHist} color="#3b82f6" />
        <Chart title="Perceived exertion — distribution" data={data.exDist} color="#f59e0b" />
        <Chart title="Mood rating — distribution" data={data.moodDist} color="#8b5cf6" />
      </div>
    </div>
  );
}