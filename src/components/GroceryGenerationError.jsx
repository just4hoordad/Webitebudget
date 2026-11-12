import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";

export default function GroceryGenerationError({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div role="alert" className="bba-t bg-[#FF8FB5] text-[#111827] space-y-4">
      <div className="flex gap-3 items-start">
        <div className="h-10 w-10 rounded-2xl bg-white border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0">
          <AlertCircle className="h-5 w-5 text-[#FF3E7F]" />
        </div>
        <p className="text-sm font-heading font-bold text-[#111827] pt-1">{message}</p>
      </div>
      <Button variant="outline" className="w-full gap-2" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" /> {t("regenerate")}
      </Button>
    </div>
  );
}