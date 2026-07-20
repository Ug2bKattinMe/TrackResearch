import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getOrCreateTrackingNumber } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Lock, Lightbulb } from "lucide-react";

export default function GenericSubmissionForm({ project, history, onSubmitted, initialSubmission, locked }) {
  const [trackingNumber, setTN] = useState(null);
  const editing = Boolean(initialSubmission);
  const submittedLabels = new Set((history || []).map((h) => h.session_label));
  const sessions = project.session_options || [];
  const [sessionLabel, setSessionLabel] = useState(initialSubmission?.session_label || "");
  const [formData, setFormData] = useState({
    activity: initialSubmission?.payload?.activity || "",
    duration: initialSubmission?.payload?.duration || "",
    intensity: initialSubmission?.payload?.intensity || "",
    notes: initialSubmission?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrCreateTrackingNumber().then(setTN);
  }, []);

  const setField = (k, v) => setFormData((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!sessionLabel) {
      setError("Please select a session.");
      return;
    }
    if (!formData.activity || !formData.duration || !formData.intensity) {
      setError("Please complete all required fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        activity: formData.activity,
        duration: formData.duration,
        intensity: formData.intensity,
      };
      if (editing) {
        await base44.entities.Submission.update(initialSubmission.id, {
          notes: formData.notes || "",
          payload,
        });
      } else {
        await base44.entities.Submission.create({
          tracking_number: trackingNumber,
          project_id: project.id,
          session_label: sessionLabel,
          payload,
          notes: formData.notes || "",
        });
        setSessionLabel("");
        setFormData({ activity: "", duration: "", intensity: "", notes: "" });
      }
      onSubmitted && onSubmitted();
    } catch (err) {
      setError(err.message || "Submission failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-900">
          <div className="font-semibold mb-1">Example submission (best practice)</div>
          <p className="text-blue-800">
            Be specific and include context — durations, intensities, and how you felt.
          </p>
          <div className="mt-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-xs text-slate-700 space-y-0.5">
            <div><span className="font-medium">Session:</span> Daily Activity Log</div>
            <div><span className="font-medium">Activity:</span> Walking</div>
            <div><span className="font-medium">Duration:</span> 90 minutes</div>
            <div><span className="font-medium">Intensity:</span> 6</div>
            <div><span className="font-medium">Notes:</span> "Picked up to a brisk pace the final 15 minutes. Slightly fatigued afterward; no unusual muscle pain, though resting heart rate was a bit higher than yesterday."</div>
          </div>
        </div>
      </div>
    </div>
    <form onSubmit={submit} className="rounded-lg border border-slate-200 p-6 space-y-5 bg-white">
      {locked && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Lock className="w-4 h-4" /> This project is locked — submissions can be viewed but not edited.
        </div>
      )}

      <div>
        <h2 className="font-heading text-lg font-semibold text-primary">
          {editing ? "Edit your submission" : "Submit your data"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Anonymous — linked only to your tracking number.</p>
      </div>

      <div className="space-y-2">
        <Label>Session</Label>
        {editing ? (
          <div className="rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-700 bg-slate-50">{sessionLabel}</div>
        ) : sessions.length > 0 ? (
          <Select value={sessionLabel} disabled={locked} onValueChange={setSessionLabel}>
            <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                  {submittedLabels.has(s) ? " ✓" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input value={sessionLabel} disabled={locked} onChange={(e) => setSessionLabel(e.target.value)} placeholder="Session label" />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Activity type <span className="text-destructive">*</span></Label>
          <Input
            value={formData.activity}
            disabled={locked}
            onChange={(e) => setField("activity", e.target.value)}
            required
            placeholder="e.g. Walking, Cycling, Reading"
          />
        </div>
        <div className="space-y-2">
          <Label>Duration (minutes) <span className="text-destructive">*</span></Label>
          <Input
            type="number"
            min="0"
            value={formData.duration}
            disabled={locked}
            onChange={(e) => setField("duration", e.target.value)}
            required
            placeholder="e.g. 90"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Intensity (1–10) <span className="text-destructive">*</span></Label>
        <Select value={formData.intensity} disabled={locked} onValueChange={(v) => setField("intensity", v)}>
          <SelectTrigger><SelectValue placeholder="Select intensity" /></SelectTrigger>
          <SelectContent>
            {["1","2","3","4","5","6","7","8","9","10"].map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Detailed notes</Label>
        <Textarea
          value={formData.notes}
          disabled={locked}
          onChange={(e) => setField("notes", e.target.value)}
          rows={5}
          placeholder="Add context — how you felt, conditions, anything notable..."
        />
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <Button type="submit" disabled={saving || locked}>
        <Send className="w-4 h-4 mr-2" /> {saving ? "Saving..." : editing ? "Save changes" : "Submit data"}
      </Button>
    </form>
    </>
  );
}