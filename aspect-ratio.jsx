import { useEffect, useState } from "react";
import { getOrCreateTrackingNumber } from "@/lib/tracking";
import { Copy, Check, Fingerprint } from "lucide-react";

export default function TrackingBadge() {
  const [code, setCode] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getOrCreateTrackingNumber().then(setCode);
  }, []);

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!code) return <div className="h-9 w-36 rounded-md bg-slate-100 animate-pulse" />;

  return (
    <button
      onClick={copy}
      className="group flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 h-9 hover:border-primary transition-colors"
      title="Copy your anonymous tracking number"
    >
      <Fingerprint className="w-3.5 h-3.5 text-[#14b8a6]" strokeWidth={2.5} />
      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium hidden sm:block">ID</span>
      <span className="font-mono text-[13px] font-semibold text-primary tracking-tight">{code}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[#14b8a6]" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
      )}
    </button>
  );
}