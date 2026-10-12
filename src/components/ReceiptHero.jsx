import { useLanguage } from "@/lib/LanguageContext";
import CreditBar from "@/components/monetization/CreditBar";

const IMG = "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/6d08a88a4_generated_7eb1ed23.jpg";

export default function ReceiptHero() {
  const { t } = useLanguage();
  return (
    <div className="receipt relative bg-card px-5 pt-[22px] pb-[34px] border border-b-0 border-[#d9dccf] shadow-[0_10px_24px_rgba(104,110,94,.18)]">
      <div className="flex justify-between items-start gap-3">
        <div className="font-mono text-[11px] tracking-[.18em] uppercase text-muted-foreground mb-2.5">BudgetBite</div>
        <img src={IMG} alt="Fresh groceries" className="w-[68px] h-[68px] rounded-full object-cover border-[3px] border-white shrink-0 shadow-[0_0_0_2px_#78a71b,0_6px_12px_rgba(0,0,0,.15)]" />
      </div>
      <CreditBar variant="pill" className="my-3.5" />
      <div className="border-t-2 border-dashed border-[#c9cdbd] mt-1 mb-4" />
      <h1 className="rise font-heading text-[38px] leading-[1.05] font-extrabold tracking-[-.03em] text-foreground" style={{ animationDelay: ".5s" }}>
        {t("heroTitle1")} <span className="text-primary">{t("heroTitle2")}</span>
      </h1>
      <p className="rise text-sm leading-[1.45] text-muted-foreground mt-2.5" style={{ animationDelay: ".65s" }}>{t("planSubtitle")}</p>
      <div className="rise flex justify-between font-mono text-[13px] font-bold mt-[18px] pt-3 border-t-2 border-dashed border-[#c9cdbd]" style={{ animationDelay: ".8s" }}>
        <span>TOTAL SAVED</span><b className="text-primary">€—</b>
      </div>
    </div>
  );
}