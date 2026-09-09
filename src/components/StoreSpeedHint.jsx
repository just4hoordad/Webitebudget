import { useLanguage } from "@/lib/LanguageContext";
import { Zap } from "lucide-react";

const HINT = {
  en: "Choosing just one supermarket makes your list generate faster.",
  de: "Wenn du nur einen Supermarkt wählst, wird deine Liste schneller erstellt.",
  fr: "Choisir un seul supermarché accélère la génération de votre liste.",
  es: "Elegir un solo supermercado hace que tu lista se genere más rápido.",
  ar: "اختيار سوبر ماركت واحد فقط يجعل قائمتك تُنشأ بشكل أسرع.",
  ru: "Выбор одного супермаркета ускоряет создание вашего списка.",
  uk: "Вибір одного супермаркету пришвидшує створення вашого списку.",
  fa: "انتخاب تنها یک سوپرمارکت باعث می‌شود فهرست شما سریع‌تر ساخته شود.",
  zh: "只选择一家超市会让你的清单生成得更快。",
  vi: "Chỉ chọn một siêu thị sẽ giúp danh sách của bạn được tạo nhanh hơn.",
  tr: "Tek bir süpermarket seçmek listenin daha hızlı oluşturulmasını sağlar.",
  it: "Scegliere un solo supermercato rende la lista più veloce da generare.",
  pt: "Escolher apenas um supermercado faz a tua lista gerar mais rápido.",
  pl: "Wybranie tylko jednego supermarketu przyspiesza tworzenie listy.",
  nl: "Eén supermarkt kiezen maakt je lijst sneller klaar.",
  sv: "Att välja bara ett snabbköp gör att din lista skapas snabbare.",
  no: "Å velge bare én supermarked gjør at listen din lages raskere.",
  da: "Valg af kun ét supermarked gør, at din liste laves hurtigere.",
  fi: "Vain yhden supermarketin valinta nopeuttaa listan luomista.",
  cs: "Výběr jen jednoho supermarketu zrychlí vytvoření seznamu.",
  hu: "Csak egy szupermarket kiválasztása felgyorsítja a lista létrehozását.",
  ro: "Alegerea unui singur supermarket face lista să se genereze mai repede.",
  el: "Η επιλογή μόνο ενός σούπερ μάρκετ κάνει τη λίστα σας να δημιουργείται πιο γρήγορα.",
};

export default function StoreSpeedHint() {
  const { currentLanguage } = useLanguage();
  const text = HINT[currentLanguage.code] || HINT.en;
  return (
    <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
      <Zap className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-snug">{text}</p>
    </div>
  );
}