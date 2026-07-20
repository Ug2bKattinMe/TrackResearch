import { jsPDF } from "jspdf";
import { validateSubmission } from "@/lib/quality";

function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function generateReport(project, submissions) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  const line = (text, opts = {}) => {
    doc.setFontSize(opts.size || 11);
    doc.setFont("helvetica", opts.style || "normal");
    const lines = doc.splitTextToSize(text, pageW - 28);
    lines.forEach((l) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(l, 14, y);
      y += 6;
    });
    y += opts.gap || 1;
  };

  // Header
  line("ResearchTrack — Summary Report", { size: 18, style: "bold", gap: 3 });
  line(`Project: ${project.name}`, { size: 14, style: "bold", gap: 3 });
  line(`Generated: ${new Date().toLocaleString()}`, { size: 9, gap: 4 });

  // Status
  line(`Status: ${project.status}${project.locked ? " (locked)" : ""}`, { size: 10, gap: 3 });
  if (project.start_date || project.end_date) {
    line(`Submission window: ${project.start_date || "open"} → ${project.end_date || "open"}`, { size: 10, gap: 3 });
  }

  // Goal
  if (project.goal_description) {
    line("Goal", { size: 12, style: "bold", gap: 2 });
    line(project.goal_description, { size: 10, gap: 3 });
  }
  y += 3;

  // Response summary
  const participants = new Set(submissions.map((s) => s.tracking_number)).size;
  line("Response Summary", { size: 13, style: "bold", gap: 3 });
  line(`Total submissions: ${submissions.length}`, { size: 10, gap: 2 });
  line(`Unique participants: ${participants}`, { size: 10, gap: 4 });

  const sessionCounts = {};
  submissions.forEach((s) => {
    sessionCounts[s.session_label] = (sessionCounts[s.session_label] || 0) + 1;
  });
  if (Object.keys(sessionCounts).length) {
    line("Submissions per session:", { size: 10, style: "bold", gap: 2 });
    Object.entries(sessionCounts).forEach(([k, v]) => line(`  ${k}: ${v}`, { size: 10, gap: 1 }));
    y += 2;
  }

  // Data quality
  const flagged = submissions.filter((s) => validateSubmission(s).length > 0).length;
  line("Data Quality", { size: 13, style: "bold", gap: 3 });
  line(`Valid entries: ${submissions.length - flagged}`, { size: 10, gap: 2 });
  line(`Flagged entries: ${flagged}`, { size: 10, gap: 4 });

  // Key metrics
  const num = (key) =>
    submissions
      .map((s) => Number(s.payload?.[key]))
      .filter((v) => v != null && !isNaN(v));

  const statLine = (label, key) => {
    const a = num(key);
    if (!a.length) return;
    const m = avg(a);
    line(
      `${label}: n=${a.length}, mean=${m.toFixed(1)}, min=${Math.min(...a)}, max=${Math.max(...a)}`,
      { size: 10, gap: 2 }
    );
  };

  line("Key Metrics", { size: 13, style: "bold", gap: 3 });
  statLine("Heart rate (before)", "heart_rate_before");
  statLine("Heart rate (after)", "heart_rate_after");
  statLine("Perceived exertion", "perceived_exertion");
  statLine("Mood rating", "mood_rating");

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `ResearchTrack — ${project.name} — page ${i} of ${pages}`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`${project.name.replace(/\s+/g, "_")}_summary_report.pdf`);
}