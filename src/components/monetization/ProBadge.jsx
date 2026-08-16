import { Crown } from "lucide-react";

export default function ProBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-primary/15 text-primary border border-primary/30 ${className}`}>
      <Crown className="h-3 w-3" /> Pro
    </span>
  );
}