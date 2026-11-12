import { useState, useEffect } from "react";
import { Euro } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const HINT = {
  en: "Click the number to enter your exact monthly budget",
  de: "Klicke auf die Zahl, um dein genaues Monatsbudget einzugeben",
  fr: "Cliquez sur le chiffre pour saisir votre budget mensuel exact",
  es: "Haz clic en el número para introducir tu presupuesto mensual exacto",
  it: "Clicca sul numero per inserire il tuo budget mensile esatto",
  pt: "Clique no número para inserir o seu orçamento mensal exato",
  nl: "Klik op het getal om je exacte maandbudget in te voeren",
  pl: "Kliknij liczbę, aby wpisać dokładny miesięczny budżet",
  tr: "Tam aylık bütçeni girmek için sayıya tıkla",
  ar: "انقر على الرقم لإدخال ميزانيتك الشهرية بدقة",
  ru: "Нажмите на число, чтобы ввести точный месячный бюджет",
  uk: "Натисніть на число, щоб ввести точний місячний бюджет",
  fa: "روی عدد کلیک کنید تا بودجه ماهانه دقیق خود را وارد کنید",
  zh: "点击数字输入你的确切月度预算",
  vi: "Nhấn vào số để nhập ngân sách hàng tháng chính xác của bạn",
  sv: "Klicka på siffran för att ange din exakta månadsbudget",
  no: "Klikk på tallet for å skrive inn ditt nøyaktige månedsbudsjett",
  da: "Klik på tallet for at indtaste dit præcise månedsbudget",
  fi: "Napauta numeroa syöttääksesi tarkan kuukausibudjettisi",
  cs: "Klikněte na číslo a zadejte svůj přesný měsíční rozpočet",
  hu: "Kattints a számra a pontos havi kereted megadásához",
  ro: "Apasă pe număr pentru a introduce bugetul lunar exact",
  el: "Κάντε κλικ στον αριθμό για να εισάγετε τον ακριβή μηνιαίο προϋπολογισμό σας",
};

export default function BudgetInput({ value, onChange, label }) {
  const { currentLanguage } = useLanguage();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="flex items-center gap-1 bg-[#FFB020] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827] font-heading font-black text-xl px-3 py-1 rounded-xl">
          <Euro className="h-5 w-5 shrink-0" />
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={2400}
            value={draft}
            onFocus={e => e.target.select()}
            onChange={e => {
              setDraft(e.target.value);
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val > 0) onChange(Math.min(2400, val));
            }}
            onBlur={() => setDraft(String(value))}
            className="w-20 bg-transparent text-[#111827] font-heading font-black text-xl focus:outline-none text-right"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-right">{HINT[currentLanguage?.code] || HINT.en}</p>
    </div>
  );
}