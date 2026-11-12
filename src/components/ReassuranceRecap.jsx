import { useLanguage } from "@/lib/LanguageContext";
import { Salad, CalendarDays, Wallet, Flame, Users, Target, TrendingUp, Sparkles } from "lucide-react";

export const REASSURANCE_STR = {
  en: { title: "Here's what you chose", body: "You picked these yourself — now I'm building a grocery list tailored exactly to YOUR choices, and hunting down the cheapest prices across your stores to save you as much money as possible." },
  de: { title: "Das hast du gewählt", body: "Du hast das selbst ausgewählt — jetzt erstelle ich eine Einkaufsliste, die genau auf DEINE Wahl zugeschnitten ist, und suche die günstigsten Preise in deinen Märkten, um dich so viel wie möglich sparen zu lassen." },
  fr: { title: "Voici ce que vous avez choisi", body: "Vous avez choisi cela vous-même — je prépare maintenant une liste de courses adaptée exactement à VOS choix, et je déniche les prix les moins chers dans vos magasins pour vous faire économiser le plus possible." },
  es: { title: "Esto es lo que elegiste", body: "Tú elegiste esto — ahora te preparo una lista de la compra adaptada exactamente a TUS decisiones, y busco los precios más baratos en tus tiendas para ahorrarte todo lo posible." },
  ar: { title: "إليك ما اخترت", body: "لقد اخترت هذا بنفسك — الآن أعدّ لك قائمة تسوّق مبنية تمامًا على اختياراتك أنت، وأبحث عن أرخص الأسعار في متاجرك لأوفّر لك أكبر قدر ممكن من المال." },
  ru: { title: "Вот что вы выбрали", body: "Вы выбрали это сами — теперь я составляю список продуктов точно под ВАШ выбор и нахожу самые дешёвые цены в ваших магазинах, чтобы сэкономить вам как можно больше." },
  uk: { title: "Ось що ви обрали", body: "Ви обрали це самі — тепер я складаю список продуктів саме під ВАШ вибір і знаходжу найдешевші ціни у ваших магазинах, щоб зекономити вам якомога більше." },
  fa: { title: "این چیزی است که انتخاب کردی", body: "این را خودت انتخاب کردی — حالا فهرستی دقیقاً مطابق با انتخاب‌های خودت می‌سازم و ارزان‌ترین قیمت‌ها را در فروشگاه‌هایت پیدا می‌کنم تا تا جای ممکن برایت صرفه‌جویی کنم." },
  zh: { title: "这是你选择的", body: "这是你自己选的 — 现在我为你量身定制一份完全符合你选择的购物清单，并在你的商店里寻找最便宜的价格，帮你尽可能省钱。" },
  vi: { title: "Đây là những gì bạn đã chọn", body: "Bạn đã tự chọn những điều này — giờ tôi sẽ tạo danh sách mua sắm đúng theo LỰA CHỌN của bạn, và tìm giá rẻ nhất ở các cửa hàng của bạn để tiết kiệm cho bạn nhiều nhất có thể." },
  tr: { title: "İşte seçtiğin şeyler", body: "Bunu kendin seçtin — şimdi tam SENİN seçimlerine göre bir alışveriş listesi hazırlıyorum ve marketlerinde en ucuz fiyatları bulup senin için olabildiğince çok tasarruf sağlıyorum." },
  it: { title: "Ecco cosa hai scelto", body: "L'hai scelto tu — ora preparo una lista della spesa su misura esattamente per LE TUE scelte, e cerco i prezzi più bassi nei tuoi supermercati per farti risparmiare il più possibile." },
  pt: { title: "Isto é o que escolheste", body: "Foste tu que escolheste isto — agora preparo uma lista de compras à medida exatamente das TUA escolhas, e procuro os preços mais baratos nas tuas lojas para te fazer poupar o máximo." },
  pl: { title: "Oto co wybrałeś", body: "Sam to wybrałeś — teraz przygotowuję listę zakupów dopasowaną dokładnie do TWOICH wyborów i szukam najniższych cen w twoich sklepach, żeby pomóc ci zaoszczędzić jak najwięcej." },
  nl: { title: "Dit heb jij gekozen", body: "Jij hebt dit zelf gekozen — nu maak ik een boodschappenlijst precies afgestemd op JOUW keuzes, en ik zoek de goedkoopste prijzen bij jouw winkels om je zoveel mogelijk te laten besparen." },
  sv: { title: "Det här valde du", body: "Du valde detta själv — nu skapar jag en inköpslista skräddarsydd precis för DINA val, och jag letar upp de billigaste priserna i dina butiker för att spara så mycket pengar som möjligt åt dig." },
  no: { title: "Dette valgte du", body: "Du valgte dette selv — nå lager jeg en handleliste skreddersydd nøyaktig for DINE valg, og jeg finner de billigste prisene i butikkene dine for å spare deg for så mye penger som mulig." },
  da: { title: "Det her valgte du", body: "Du valgte det selv — nu laver jeg en indkøbsliste skræddersyet præcis til DINE valg, og jeg finder de billigste priser i dine butikker for at spare dig for så mange penge som muligt." },
  fi: { title: "Tässä ovat valintasi", body: "Valitsit nämä itse — nyt laadin juuri SINUN valintojasi mukaisen kauppalistan ja etsin halvimmat hinnat kaupoistasi säästääkseni sinulle mahdollisimman paljon rahaa." },
  cs: { title: "Tohle jsi vybral", body: "Vybral sis to sám — teď sestavuji nákupní seznam přesně podle TVÉ volby a hledám nejlevnější ceny ve tvých obchodech, abych ti ušetřil co nejvíce peněz." },
  hu: { title: "Ezt választottad", body: "Ezt te magad választottad — most egy pontosan a TE választásaidra szabott bevásárlólistát készítek, és a legolcsóbb árakat keresem a boltjaidban, hogy a lehető legtöbbet spórolj neked." },
  ro: { title: "Iată ce ai ales", body: "Ai ales tu asta — acum îți pregătesc o listă de cumpărături adaptată exact la ALEGERILE tale și caut cele mai ieftine prețuri din magazinele tale ca să te ajut să economisești cât mai mult." },
  el: { title: "Αυτά επέλεξες", body: "Το επέλεξες εσύ — τώρα ετοιμάζω μια λίστα ψωνίων προσαρμοσμένη ακριβώς στις ΕΠΙΛΟΓΕΣ σου, και βρίσκω τις φθηνότερες τιμές στα σούπερ μάρκετ σου για να εξοικονομήσεις όσα περισσότερα γίνεται." },
};

const DIET_LABEL_KEYS = { balanced: "balanced", vegetarian: "vegetarian", vegan: "vegan", "high-protein": "highProtein", pescatarian: "pescatarian", "gluten-free": "glutenFree", halal: "halal", frozen: "frozenFoods", "half-cooked": "halfCooked" };
const GOAL_LABEL_KEYS = { lose: "loseWeight", maintain: "maintain", gain: "gainWeight", muscle: "buildMuscle" };

export default function ReassuranceRecap({ planStyle = "repeat", setPlanStyle }) {
  const { t, currentLanguage } = useLanguage();
  const params = new URLSearchParams(window.location.search);
  const diet = params.get("diet") || "balanced";
  const goal = params.get("goal") || "maintain";
  const days = parseInt(params.get("days") || "30", 10);
  const budget = params.get("budget") || 150;
  const calories = params.get("calories") || 2000;
  const people = params.get("people") || 1;
  const macrosParam = params.get("macros");
  const macros = macrosParam
    ? (() => { const [p, c, f] = macrosParam.split(",").map(Number); return { protein: p || 30, carbs: c || 40, fats: f || 30 }; })()
    : null;

  const s = REASSURANCE_STR[currentLanguage.code] || REASSURANCE_STR.en;
  const dietLabel = t(DIET_LABEL_KEYS[diet] || "balanced");
  const goalLabel = t(GOAL_LABEL_KEYS[goal] || "maintain");

  const cards = [
    { icon: Salad, value: dietLabel, bg: "bg-[#78a71b]" },
    { icon: CalendarDays, value: `${days} ${t("days")}`, bg: "bg-[#FFB020]" },
    { icon: Wallet, value: `€${parseFloat(budget).toFixed(0)}`, bg: "bg-[#FF8FB5]" },
    { icon: Flame, value: `${calories} kcal`, bg: "bg-[#7DD3FC]" },
    { icon: Users, value: `${people} ${t("personS")}`, bg: "bg-[#C084FC]" },
    { icon: Target, value: goalLabel, bg: "bg-[#F3F8E6]" },
  ];

  return (
    <div className="bba-t bg-card text-card-foreground p-0 overflow-hidden">
      <div className="bg-[#7DD3FC] text-[#111827] px-5 py-4 border-b-[3px] border-[#111827] flex items-center gap-3.5">
        <div className="h-10 w-10 rounded-2xl bg-white border-[2.5px] border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-[#111827]" />
        </div>
        <div>
          <span className="bba-sticker mb-1">Loadout Locked</span>
          <h2 className="font-heading font-black text-lg text-[#111827] leading-tight">{s.title}</h2>
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className={`flex items-center gap-2.5 ${c.bg} text-[#111827] border-2 border-[#111827] rounded-2xl px-3 py-2.5 shadow-[2px_2px_0_#111827]`}
              >
                <div className="h-8 w-8 rounded-xl bg-white border-[1.5px] border-[#111827] flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[#111827]" />
                </div>
                <span className="text-sm font-heading font-black text-[#111827] truncate">{c.value}</span>
              </div>
            );
          })}
        </div>
        {macros && (
          <div className="mt-2.5 flex items-center gap-2.5 bg-[#F3F8E6] text-[#111827] border-2 border-[#111827] rounded-2xl px-3.5 py-2.5 shadow-[2px_2px_0_#111827]">
            <div className="h-8 w-8 rounded-xl bg-white border-[1.5px] border-[#111827] flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-[#111827]" />
            </div>
            <div className="grid grid-cols-3 gap-2 flex-1 min-w-0">
              {[["protein", "Protein", macros.protein], ["carbs", "Carbs", macros.carbs], ["fats", "Fat", macros.fats]].map(([key, fallback, val]) => (
                <div key={key} className="min-w-0">
                  <p className="text-[10px] font-heading font-black uppercase tracking-wider text-[#111827]/70 truncate">{t(key) === key ? fallback : t(key)}</p>
                  <p className="text-sm font-heading font-black text-[#111827]">{val}%</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm text-muted-foreground font-medium leading-relaxed mt-4">
          {s.body}
        </p>
        <div className="mt-5 pt-4 border-t-2 border-[#111827]/15 dark:border-white/15">
          <h3 className="font-heading font-black text-foreground">{t("weeklyPlanTitle")}</h3>
          <p className="text-xs text-muted-foreground font-medium mb-3">{t("weeklyPlanSubtitle")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPlanStyle && setPlanStyle("repeat")}
              className={`flex flex-col items-start gap-1 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                planStyle === "repeat"
                  ? "border-[#111827] bg-[#78a71b] text-[#111827] shadow-[3px_3px_0_#111827]"
                  : "border-[#111827] dark:border-[#78a71b] bg-background text-foreground hover:bg-[#F3F8E6] hover:text-[#111827]"
              }`}
            >
              <span className="text-sm font-heading font-black">{t("repeatWeeklyPlan")}</span>
              <span className={`text-xs font-medium ${planStyle === "repeat" ? "text-[#111827]/80" : "text-muted-foreground"}`}>{t("repeatWeeklyPlanDesc")}</span>
            </button>
            <button
              type="button"
              onClick={() => setPlanStyle && setPlanStyle("unique")}
              className={`flex flex-col items-start gap-1 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                planStyle === "unique"
                  ? "border-[#111827] bg-[#FFB020] text-[#111827] shadow-[3px_3px_0_#111827]"
                  : "border-[#111827] dark:border-[#78a71b] bg-background text-foreground hover:bg-[#F3F8E6] hover:text-[#111827]"
              }`}
            >
              <span className="text-sm font-heading font-black">{t("uniqueMonthlyPlan")}</span>
              <span className={`text-xs font-medium ${planStyle === "unique" ? "text-[#111827]/80" : "text-muted-foreground"}`}>{t("uniqueMonthlyPlanDesc")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}