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
import { Send, Lock } from "lucide-react";
import ConversionTool from "@/components/ConversionTool";

const FITNESS = ["beginner", "intermediate", "advanced", "elite"];
const SEX = ["male", "female", "other", "prefer_not_to_say"];
const METRIC_TYPES = [
  { value: "reps", label: "Reps completed" },
  { value: "distance_km", label: "Distance (km)" },
  { value: "weight_kg", label: "Weight lifted (kg)" },
];

const SET_KEYS = [
  { key: "baseline", label: "Baseline", hint: "No music" },
  { key: "unfamiliar", label: "Unfamiliar music", hint: "A song you don't know" },
  { key: "favorite", label: "Favorite song", hint: "Your favorite track" },
];

function emptySet() {
  return {
    heart_rate_after: "",
    workout_metric_type: "reps",
    workout_metric_value: "",
    perceived_exertion: "",
    mood_rating: "",
  };
}

function blankForm() {
  return {
    age: "",
    sex: "",
    height_cm: "",
    weight_kg: "",
    fitness_level: "",
    heart_rate_before: "",
    sets: {
      baseline: emptySet(),
      unfamiliar: emptySet(),
      favorite: emptySet(),
    },
    notes: "",
  };
}

export default function MusicSubmissionForm({ project, history, onSubmitted, initialSubmission, locked }) {
  const [trackingNumber, setTN] = useState(null);
  const editing = Boolean(initialSubmission);
  const [form, setForm] = useState(() => {
    if (initialSubmission) {
      const p = initialSubmission.payload || {};
      const sets = p.sets || {};
      return {
        age: p.age ?? "",
        sex: p.sex || "",
        height_cm: p.height_cm ?? "",
        weight_kg: p.weight_kg ?? "",
        fitness_level: p.fitness_level || "",
        heart_rate_before: p.heart_rate_before ?? "",
        sets: {
          baseline: { ...emptySet(), ...(sets.baseline || {}) },
          unfamiliar: { ...emptySet(), ...(sets.unfamiliar || {}) },
          favorite: { ...emptySet(), ...(sets.favorite || {}) },
        },
        notes: initialSubmission.notes || "",
      };
    }
    return blankForm();
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrCreateTrackingNumber().then(setTN);
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setField = (setKey, k, v) =>
    setForm((f) => ({ ...f, sets: { ...f.sets, [setKey]: { ...f.sets[setKey], [k]: v } } }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const numOrNull = (v) => (v === "" ? null : Number(v));
      const buildSet = (s) => ({
        heart_rate_after: s.heart_rate_after || null,
        workout_metric_type: s.workout_metric_type,
        workout_metric_value: numOrNull(s.workout_metric_value),
        perceived_exertion: numOrNull(s.perceived_exertion),
        mood_rating: numOrNull(s.mood_rating),
      });
      const payload = {
        age: numOrNull(form.age),
        sex: form.sex || null,
        height_cm: numOrNull(form.height_cm),
        weight_kg: numOrNull(form.weight_kg),
        fitness_level: form.fitness_level || null,
        heart_rate_before: form.heart_rate_before || null,
        sets: {
          baseline: buildSet(form.sets.baseline),
          unfamiliar: buildSet(form.sets.unfamiliar),
          favorite: buildSet(form.sets.favorite),
        },
      };
      const sessionLabel = editing
        ? initialSubmission.session_label || "Workout"
        : `Workout ${new Date().toLocaleDateString()}`;
      if (editing) {
        await base44.entities.Submission.update(initialSubmission.id, {
          payload,
          notes: form.notes || "",
        });
      } else {
        await base44.entities.Submission.create({
          tracking_number: trackingNumber,
          project_id: project.id,
          session_label: sessionLabel,
          payload,
          notes: form.notes || "",
        });
        setForm((f) => ({ ...f, notes: "" }));
      }
      onSubmitted && onSubmitted();
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 p-6 space-y-6 bg-white">
      {locked && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Lock className="w-4 h-4" /> This project is locked — submissions can be viewed but not edited.
        </div>
      )}

      <div>
        <h2 className="font-heading text-lg font-semibold text-primary">
          {editing ? "Edit your submission" : "Submit your data"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Record all three conditions during the same workout, then submit once. All fields are anonymous and linked only to your tracking number.
        </p>
      </div>

      <ConversionTool />

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Biostatistics</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Age">
            <Input type="number" value={form.age} disabled={locked} onChange={(e) => set("age", e.target.value)} placeholder="years" />
          </Field>
          <Field label="Height (cm)">
            <Input type="number" value={form.height_cm} disabled={locked} onChange={(e) => set("height_cm", e.target.value)} placeholder="cm" />
          </Field>
          <Field label="Weight (kg)">
            <Input type="number" value={form.weight_kg} disabled={locked} onChange={(e) => set("weight_kg", e.target.value)} placeholder="kg" />
          </Field>
          <Field label="Sex">
            <Select value={form.sex} disabled={locked} onValueChange={(v) => set("sex", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {SEX.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Fitness level">
            <Select value={form.fitness_level} disabled={locked} onValueChange={(v) => set("fitness_level", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {FITNESS.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Heart rate (before workout)">
            <Input type="text" value={form.heart_rate_before} disabled={locked} onChange={(e) => set("heart_rate_before", e.target.value)} placeholder="e.g. 150 or 140-160" />
          </Field>
        </div>
      </div>

      {SET_KEYS.map(({ key, label, hint }, idx) => (
        <div key={key} className="rounded-lg border border-slate-200 p-5 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex-none w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
              {idx + 1}
            </span>
            <div>
              <div className="text-sm font-semibold text-primary">{label}</div>
              <div className="text-xs text-slate-500">{hint}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Heart rate (after)">
              <Input type="text" value={form.sets[key].heart_rate_after} disabled={locked} onChange={(e) => setField(key, "heart_rate_after", e.target.value)} placeholder="e.g. 150 or 140-160" />
            </Field>
            <Field label="Output metric">
              <Select value={form.sets[key].workout_metric_type} disabled={locked} onValueChange={(v) => setField(key, "workout_metric_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRIC_TYPES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Output value">
              <Input type="number" value={form.sets[key].workout_metric_value} disabled={locked} onChange={(e) => setField(key, "workout_metric_value", e.target.value)} placeholder="value" />
            </Field>
            <Field label="Perceived exertion (1–10)">
              <Input type="number" min="1" max="10" value={form.sets[key].perceived_exertion} disabled={locked} onChange={(e) => setField(key, "perceived_exertion", e.target.value)} placeholder="1–10" />
              <p className="text-[11px] text-slate-400 mt-1">1 = lowest effort, 10 = highest</p>
            </Field>
            <Field label="Mood rating (1–10)">
              <Input type="number" min="1" max="10" value={form.sets[key].mood_rating} disabled={locked} onChange={(e) => setField(key, "mood_rating", e.target.value)} placeholder="1–10" />
            </Field>
          </div>
        </div>
      ))}

      <div className="space-y-1.5">
        <Label className="text-xs text-slate-500">Notes (optional)</Label>
        <Textarea value={form.notes} disabled={locked} onChange={(e) => set("notes", e.target.value)} placeholder="Any observations across the three conditions..." rows={2} />
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <Button type="submit" disabled={saving || locked} className="w-full sm:w-auto">
        <Send className="w-4 h-4 mr-2" /> {saving ? "Saving..." : editing ? "Save changes" : "Submit data"}
      </Button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-500">{label}</Label>
      {children}
    </div>
  );
}