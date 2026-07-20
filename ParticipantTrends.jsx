import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowLeftRight } from "lucide-react";

function round(n) {
  return Math.round(n);
}

export default function ConversionTool() {
  const [heightVal, setHeightVal] = useState("");
  const [heightDir, setHeightDir] = useState("cmToIn");
  const [weightVal, setWeightVal] = useState("");
  const [weightDir, setWeightDir] = useState("lbToKg");

  const heightOut = (() => {
    const v = parseFloat(heightVal);
    if (isNaN(v)) return "";
    return heightDir === "cmToIn" ? round(v / 2.54) : round(v * 2.54);
  })();

  const weightOut = (() => {
    const v = parseFloat(weightVal);
    if (isNaN(v)) return "";
    return weightDir === "lbToKg" ? round(v / 2.20462) : round(v * 2.20462);
  })();

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-primary" />
        <div className="text-sm font-semibold text-primary">Unit conversion tool</div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        Use this tool to convert your own measurements before entering them in the biostatistics
        fields below. Type a value, use the arrow button to set the direction you want to convert,
        and the result — rounded to the nearest whole number — appears on the right. Copy that
        number into the matching field (height in cm, weight in kg).
      </p>

      <ConverterRow
        label="Height"
        from={heightDir === "cmToIn" ? "cm" : "in"}
        to={heightDir === "cmToIn" ? "in" : "cm"}
        value={heightVal}
        onChange={setHeightVal}
        onToggle={() => setHeightDir((d) => (d === "cmToIn" ? "inToCm" : "cmToIn"))}
        output={heightOut}
      />
      <ConverterRow
        label="Weight"
        from={weightDir === "lbToKg" ? "lb" : "kg"}
        to={weightDir === "lbToKg" ? "kg" : "lb"}
        value={weightVal}
        onChange={setWeightVal}
        onToggle={() => setWeightDir((d) => (d === "lbToKg" ? "kgToLb" : "lbToKg"))}
        output={weightOut}
      />
    </div>
  );
}

function ConverterRow({ label, from, to, value, onChange, onToggle, output }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-500">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={from} />
        </div>
        <Button type="button" variant="outline" size="icon" onClick={onToggle} title="Swap direction">
          <ArrowLeftRight className="w-4 h-4" />
        </Button>
        <div className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 min-h-[36px] flex items-center">
          {output !== "" ? `${output} ${to}` : <span className="text-slate-400">{to}</span>}
        </div>
      </div>
      <div className="text-[11px] text-slate-400">{from} → {to}</div>
    </div>
  );
}