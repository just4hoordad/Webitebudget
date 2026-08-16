import { Crown } from "lucide-react";

export default function CreditPill({ credits, isPro }) {
  const empty = credits <= 0;
  const cls = isPro
    ? "bg-primary/15 text-primary border-primary/30"
    : empty
    ? "bg-destructive/10 text-destructive border-destructive/30"
    : "bg-green-500/10 text-green-600 border-green-500/30";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-heading font-semibold border whitespace-nowrap ${cls}`}>
      {isPro && <Crown className="h-3 w-3" />}
      {credits} {isPro ? "left" : credits === 1 ? "free gen" : "free gens"}
    </span>
  );
}