import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Download,
  Pencil,
  BarChart3,
  Database,
  Trash2,
  Lock,
  Unlock,
  Copy,
  AlertTriangle,
  CheckCircle2,
  StickyNote,
  Calendar,
  FileText,
} from "lucide-react";
import SessionAnalytics from "@/components/SessionAnalytics";
import ParticipantTrends from "@/components/ParticipantTrends";
import { validateSubmission } from "@/lib/quality";
import { generateReport } from "@/lib/report";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

export default function Admin() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [qualityFilter, setQualityFilter] = useState("all");
  const [view, setView] = useState("submissions");

  const load = async () => {
    setLoading(true);
    try {
      const ps = await base44.entities.Project.list("-created_date", 100);
      setProjects(ps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectProject = async (p) => {
    setSelected(p);
    setSubLoading(true);
    setQualityFilter("all");
    try {
      const subs = await base44.entities.Submission.filter({ project_id: p.id }, "-created_date", 500);
      setSubmissions(subs);
    } finally {
      setSubLoading(false);
    }
  };

  const toggleLock = async (p) => {
    await base44.entities.Project.update(p.id, { locked: !p.locked });
    load();
    if (selected?.id === p.id) {
      setSelected({ ...selected, locked: !p.locked });
    }
  };

  const cloneProject = async (p) => {
    await base44.entities.Project.create({
      name: `${p.name} (copy)`,
      form_type: p.form_type || "music_performance",
      goal_description: p.goal_description || "",
      data_needed: p.data_needed || "",
      submission_instructions: p.submission_instructions || "",
      session_options: p.session_options || [],
      status: "active",
      locked: false,
      start_date: "",
      end_date: "",
    });
    load();
  };

  const deleteProject = async (p) => {
    if (!confirm(`Delete project "${p.name}"? Submissions will remain but the project will be removed.`)) return;
    await base44.entities.Project.delete(p.id);
    if (selected?.id === p.id) {
      setSelected(null);
      setSubmissions([]);
    }
    load();
  };

  const updateNote = (id, researcher_notes) => {
    setSubmissions((subs) => subs.map((s) => (s.id === id ? { ...s, researcher_notes } : s)));
  };

  const exportCSV = () => {
    if (!submissions.length) return;
    const baseCols = ["tracking_number", "session_label", "submitted_date"];
    const payloadKeys = new Set();
    submissions.forEach((s) => {
      if (s.payload) Object.keys(s.payload).forEach((k) => payloadKeys.add(k));
    });
    const headers = [...baseCols, ...payloadKeys, "participant_notes", "researcher_notes", "quality_flags"];
    const rows = submissions.map((s) => {
      const row = [
        s.tracking_number || "",
        `"${(s.session_label || "").replace(/"/g, '""')}"`,
        s.created_date ? new Date(s.created_date).toISOString() : "",
      ];
      payloadKeys.forEach((k) => row.push(s.payload?.[k] ?? ""));
      row.push(`"${(s.notes || "").replace(/"/g, '""')}"`);
      row.push(`"${(s.researcher_notes || "").replace(/"/g, '""')}"`);
      row.push(`"${validateSubmission(s).join("; ").replace(/"/g, '""')}"`);
      return row.join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(selected.name || "submissions").replace(/\s+/g, "_")}_submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const flaggedCount = submissions.filter((s) => validateSubmission(s).length > 0).length;

  const filteredSubs =
    qualityFilter === "flagged"
      ? submissions.filter((s) => validateSubmission(s).length > 0)
      : qualityFilter === "valid"
      ? submissions.filter((s) => validateSubmission(s).length === 0)
      : submissions;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="font-heading font-semibold text-primary text-sm">ResearchTrack · Researcher Portal</div>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm">
              View participant site
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projects</h2>
            <Link to="/admin/project/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> New
              </Button>
            </Link>
          </div>
          {loading ? (
            <div className="h-20 bg-white rounded-lg animate-pulse" />
          ) : projects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No projects yet.
            </div>
          ) : (
            projects.map((p) => (
              <div
                key={p.id}
                onClick={() => selectProject(p)}
                className={`cursor-pointer rounded-lg border bg-white p-4 transition-colors ${
                  selected?.id === p.id ? "border-primary" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-heading font-semibold text-primary text-sm flex items-center gap-1.5">
                    {p.name}
                    {p.locked && <Lock className="w-3 h-3 text-amber-600" />}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                      p.status === "active" ? "bg-[#14b8a6]/15 text-[#0d9488]" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.goal_description}</p>
                <div className="flex items-center gap-1 mt-3">
                  <Link to={`/admin/project/${p.id}/edit`} onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(p);
                    }}
                  >
                    {p.locked ? (
                      <><Unlock className="w-3 h-3" /> Unlock</>
                    ) : (
                      <><Lock className="w-3 h-3" /> Lock</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      cloneProject(p);
                    }}
                  >
                    <Copy className="w-3 h-3" /> Clone
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(p);
                    }}
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          {!selected ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center">
              <Database className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <div className="text-sm text-slate-500">Select a project to view submissions.</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-heading text-xl font-semibold text-primary">{selected.name}</h1>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                    <span>{submissions.length} submissions</span>
                    {(selected.start_date || selected.end_date) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {selected.start_date || "open"} → {selected.end_date || "open"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportCSV} disabled={!submissions.length} size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" /> Export CSV
                  </Button>
                  <Button onClick={() => generateReport(selected, submissions)} disabled={!submissions.length} size="sm">
                    <FileText className="w-4 h-4 mr-1" /> Summary Report
                  </Button>
                </div>
              </div>

              {subLoading ? (
                <div className="h-40 bg-white rounded-lg animate-pulse" />
              ) : submissions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                  No submissions yet.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
                    <button onClick={() => setView("submissions")} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${view === "submissions" ? "bg-primary text-primary-foreground" : "text-slate-600 hover:text-primary"}`}>Submissions</button>
                    <button onClick={() => setView("trends")} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${view === "trends" ? "bg-primary text-primary-foreground" : "text-slate-600 hover:text-primary"}`}>Participant Trends</button>
                  </div>

                  {view === "trends" ? (
                    <ParticipantTrends submissions={submissions} />
                  ) : (
                    <>
                      {selected.form_type === "music_performance" && (
                        <SessionAnalytics submissions={submissions} />
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <QualityPill label="All" count={submissions.length} active={qualityFilter === "all"} onClick={() => setQualityFilter("all")} />
                        <QualityPill label="Valid" count={submissions.length - flaggedCount} active={qualityFilter === "valid"} onClick={() => setQualityFilter("valid")} tone="valid" />
                        <QualityPill label="Flagged" count={flaggedCount} active={qualityFilter === "flagged"} onClick={() => setQualityFilter("flagged")} tone="flagged" />
                      </div>

                      <SubmissionsTable submissions={filteredSubs} onNoteUpdate={updateNote} />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QualityPill({ label, count, active, onClick, tone }) {
  const base = "px-3 py-1 rounded-full text-xs font-medium border transition-colors";
  const tones = {
    neutral: active ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 text-slate-600 hover:border-slate-300",
    valid: active ? "border-[#14b8a6] bg-[#14b8a6]/10 text-[#0d9488]" : "border-slate-200 text-slate-600 hover:border-slate-300",
    flagged: active ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600 hover:border-slate-300",
  };
  return (
    <button onClick={onClick} className={`${base} ${tones[tone || "neutral"]}`}>
      {label} · {count}
    </button>
  );
}

function SubmissionsTable({ submissions, onNoteUpdate }) {
  const payloadKeys = [];
  const seen = new Set();
  submissions.forEach((s) => {
    if (s.payload)
      Object.keys(s.payload).forEach((k) => {
        if (!seen.has(k)) {
          seen.add(k);
          payloadKeys.push(k);
        }
      });
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-semibold">Tracking #</th>
            <th className="px-4 py-3 font-semibold">Session</th>
            <th className="px-4 py-3 font-semibold">Submitted</th>
            {payloadKeys.map((c) => (
              <th key={c} className="px-4 py-3 font-semibold whitespace-nowrap">
                {c}
              </th>
            ))}
            <th className="px-4 py-3 font-semibold">Quality</th>
            <th className="px-4 py-3 font-semibold">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {submissions.map((s) => {
            const flags = validateSubmission(s);
            return (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-primary align-top">{s.tracking_number}</td>
                <td className="px-4 py-3 text-slate-700 align-top">{s.session_label}</td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap align-top">
                  {s.created_date ? new Date(s.created_date).toLocaleString() : ""}
                </td>
                {payloadKeys.map((c) => (
                  <td key={c} className="px-4 py-3 text-slate-600 whitespace-nowrap align-top">
                    {s.payload?.[c] ?? "—"}
                  </td>
                ))}
                <td className="px-4 py-3 align-top">
                  {flags.length === 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[#0d9488]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> OK
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {flags.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 whitespace-nowrap"
                        >
                          <AlertTriangle className="w-3 h-3" /> {f}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <ResearcherNoteCell submission={s} onSaved={onNoteUpdate} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ResearcherNoteCell({ submission, onSaved }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(submission.researcher_notes || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Submission.update(submission.id, { researcher_notes: value });
      onSaved(submission.id, value);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
            submission.researcher_notes
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-slate-200 text-slate-400 hover:text-primary hover:border-slate-300"
          }`}
        >
          <StickyNote className="w-3.5 h-3.5" />
          {submission.researcher_notes ? "Note" : "Add"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-600">Internal note (not shown to participants)</div>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder="e.g. HR looks anomalous — follow up..."
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}