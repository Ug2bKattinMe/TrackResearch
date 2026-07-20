import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getOrCreateTrackingNumber } from "@/lib/tracking";
import { Pencil, Lock, Heart, Activity } from "lucide-react";

export default function MySubmissions() {
  const [code, setCode] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const c = await getOrCreateTrackingNumber();
      setCode(c);
      const [subs, allProjects] = await Promise.all([
        base44.entities.Submission.filter({ tracking_number: c }, "-created_date", 500),
        base44.entities.Project.list("-created_date", 100),
      ]);
      setSubmissions(subs);
      const map = {};
      allProjects.forEach((p) => {
        map[p.id] = p;
      });
      setProjects(map);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-64 rounded-lg bg-slate-50 animate-pulse" />;

  const byProject = {};
  submissions.forEach((s) => {
    (byProject[s.project_id] = byProject[s.project_id] || []).push(s);
  });
  const projectIds = Object.keys(byProject);

  return (
    <div className="space-y-8 max-w-3xl">
      <header className="border-b border-slate-200 pb-6">
        <div className="text-xs uppercase tracking-wide text-[#14b8a6] font-semibold mb-2">My Submissions</div>
        <h1 className="font-heading text-3xl font-semibold text-primary tracking-tight">Your participation</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tracking number <span className="font-mono font-semibold text-primary">{code}</span> · {submissions.length}{" "}
          {submissions.length === 1 ? "submission" : "submissions"} across {projectIds.length}{" "}
          {projectIds.length === 1 ? "study" : "studies"}.
        </p>
      </header>

      {projectIds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          You haven't submitted any data yet.{" "}
          <Link to="/" className="text-primary underline">
            Browse studies
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {projectIds.map((pid) => {
            const project = projects[pid];
            const subs = byProject[pid];
            const totalSessions = project?.session_options?.length || 0;
            const completedLabels = new Set(subs.map((s) => s.session_label));
            const completed = totalSessions
              ? [...completedLabels].filter((l) => project.session_options.includes(l)).length
              : subs.length;
            const pct = totalSessions ? (completed / totalSessions) * 100 : 100;
            return (
              <div key={pid} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <Link to={`/project/${pid}`} className="font-heading font-semibold text-primary hover:underline">
                      {project?.name || "Study"}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {completed}/{totalSessions || subs.length} sessions completed
                    </div>
                  </div>
                  {project?.locked && (
                    <span className="flex items-center gap-1 text-xs text-amber-700">
                      <Lock className="w-3.5 h-3.5" /> locked
                    </span>
                  )}
                </div>
                {totalSessions > 0 && (
                  <div className="h-1.5 bg-slate-100">
                    <div className="h-full bg-[#14b8a6]" style={{ width: `${pct}%` }} />
                  </div>
                )}
                <div className="divide-y divide-slate-100">
                  {subs.map((s) => (
                    <div key={s.id} className="px-5 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-800 truncate">{s.session_label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {s.created_date ? new Date(s.created_date).toLocaleString() : ""}
                        </div>
                      </div>
                      {s.payload?.heart_rate_after != null && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                          <Heart className="w-3.5 h-3.5" /> {s.payload.heart_rate_after} BPM
                        </span>
                      )}
                      {s.payload?.perceived_exertion != null && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                          <Activity className="w-3.5 h-3.5" /> {s.payload.perceived_exertion}/10
                        </span>
                      )}
                      {!project?.locked ? (
                        <Link to={`/my-submissions/${s.id}/edit`}>
                          <span className="flex items-center gap-1 text-xs text-primary hover:underline">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </span>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">locked</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}