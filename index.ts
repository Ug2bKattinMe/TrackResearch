import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getOrCreateTrackingNumber } from "@/lib/tracking";
import { ArrowLeft } from "lucide-react";
import MusicSubmissionForm from "@/components/MusicSubmissionForm";
import GenericSubmissionForm from "@/components/GenericSubmissionForm";

export default function EditSubmission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const code = await getOrCreateTrackingNumber();
        const sub = await base44.entities.Submission.get(id);
        if (sub.tracking_number !== code) {
          setError("This submission belongs to a different tracking number and can't be edited here.");
          setLoading(false);
          return;
        }
        setSubmission(sub);
        const p = await base44.entities.Project.get(sub.project_id);
        setProject(p);
      } catch (err) {
        setError(err.message || "Could not load this submission.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="h-64 rounded-lg bg-slate-50 animate-pulse" />;
  if (error)
    return (
      <div className="max-w-3xl">
        <Link to="/my-submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> My submissions
        </Link>
        <div className="mt-6 rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500">{error}</div>
      </div>
    );

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/my-submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> My submissions
      </Link>
      {project.form_type === "music_performance" ? (
        <MusicSubmissionForm
          project={project}
          initialSubmission={submission}
          locked={project.locked}
          onSubmitted={() => navigate("/my-submissions")}
        />
      ) : (
        <GenericSubmissionForm
          project={project}
          initialSubmission={submission}
          locked={project.locked}
          onSubmitted={() => navigate("/my-submissions")}
        />
      )}
    </div>
  );
}