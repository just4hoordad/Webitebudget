import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";

export default function GroceryGenerationError({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-card p-5 space-y-4">
      <div className="flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <p className="text-sm text-foreground">{message}</p>
      </div>
      <Button variant="outline" className="w-full gap-2" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" /> {t("regenerate")}
      </Button>
    </div>
  );
}