import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";

export default function AdminProjectEdit() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    goal_description: "",
    data_needed: "",
    submission_instructions: "",
    status: "active",
    form_type: "music_performance",
    locked: false,
    start_date: "",
    end_date: "",
  });
  const [sessions, setSessions] = useState(["", "", ""]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      base44.entities.Project.get(id).then((p) => {
        setForm({
          name: p.name || "",
          goal_description: p.goal_description || "",
          data_needed: p.data_needed || "",
          submission_instructions: p.submission_instructions || "",
          status: p.status || "active",
          form_type: p.form_type || "music_performance",
          locked: p.locked || false,
          start_date: p.start_date || "",
          end_date: p.end_date || "",
        });
        setSessions(p.session_options?.length ? p.session_options : [""]);
      });
    }
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const session_options = sessions.map((s) => s.trim()).filter(Boolean);
    const data = { ...form, session_options };
    try {
      if (editing) await base44.entities.Project.update(id, data);
      else await base44.entities.Project.create(data);
      navigate("/admin");
    } catch (err) {
      alert(err.message || "Save failed");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div className="font-heading font-semibold text-primary text-sm">
            {editing ? "Edit project" : "New project"}
          </div>
        </div>
      </header>

      <form onSubmit={save} className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-1.5">
          <Label>Project name</Label>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            placeholder="e.g. Music & Athletic Performance"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Goal description</Label>
          <Textarea
            value={form.goal_description}
            onChange={(e) => set("goal_description", e.target.value)}
            required
            rows={3}
            placeholder="What is this study trying to find out?"
          />
        </div>

        <div className="space-y-1.5">
          <Label>What information is needed</Label>
          <Textarea
            value={form.data_needed}
            onChange={(e) => set("data_needed", e.target.value)}
            rows={3}
            placeholder="List the data participants should provide."
          />
        </div>

        <div className="space-y-1.5">
          <Label>How to submit (one step per line)</Label>
          <Textarea
            value={form.submission_instructions}
            onChange={(e) => set("submission_instructions", e.target.value)}
            rows={4}
            placeholder={"Step 1...\nStep 2...\nStep 3..."}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Form type</Label>
            <Select value={form.form_type} onValueChange={(v) => set("form_type", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="music_performance">Music & Performance (structured)</SelectItem>
                <SelectItem value="generic">Generic (notes only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Submission sessions</Label>
          {sessions.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={s}
                onChange={(e) => {
                  const n = [...sessions];
                  n[i] = e.target.value;
                  setSessions(n);
                }}
                placeholder={`Session ${i + 1} label`}
              />
              {sessions.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSessions(sessions.filter((_, j) => j !== i))}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => setSessions([...sessions, ""])}>
            + Add session
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Study schedule (optional)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Opens</Label>
              <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Closes</Label>
              <Input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-slate-500">Leave blank to keep the study open-ended. Outside this window the submission form is hidden from participants.</p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
          <div>
            <Label>Lock participant edits</Label>
            <p className="text-xs text-slate-500 mt-0.5">
              When locked, participants can view but not edit their submitted data.
            </p>
          </div>
          <Switch checked={form.locked} onCheckedChange={(v) => set("locked", v)} />
        </div>

        <Button type="submit" disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save project"}
        </Button>
      </form>
    </div>
  );
}