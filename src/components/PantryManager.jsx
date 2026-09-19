import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { Package, Plus, X, ChevronDown, ChevronUp } from "lucide-react";

const QUICK_ADDS = {
  en: ["Olive oil", "Salt", "Pepper", "Sugar", "Flour", "Rice", "Pasta", "Vegetable oil", "Vinegar", "Soy sauce", "Garlic", "Onions"],
  de: ["Olivenöl", "Salz", "Pfeffer", "Zucker", "Mehl", "Reis", "Nudeln", "Pflanzenöl", "Essig", "Sojasoße", "Knoblauch", "Zwiebeln"],
  fr: ["Huile d'olive", "Sel", "Poivre", "Sucre", "Farine", "Riz", "Pâtes", "Huile végétale", "Vinaigre", "Sauce soja", "Ail", "Oignons"],
  es: ["Aceite de oliva", "Sal", "Pimienta", "Azúcar", "Harina", "Arroz", "Pasta", "Aceite vegetal", "Vinagre", "Salsa de soja", "Ajo", "Cebollas"],
  ar: ["زيت الزيتون", "ملح", "فلفل", "سكر", "دقيق", "أرز", "مكرونة", "زيت نباتي", "خل", "صلصة الصويا", "ثوم", "بصل"],
  ru: ["Оливковое масло", "Соль", "Перец", "Сахар", "Мука", "Рис", "Макароны", "Растительное масло", "Уксус", "Соевый соус", "Чеснок", "Лук"],
  uk: ["Оливкова олія", "Сіль", "Перець", "Цукор", "Борошно", "Рис", "Макарони", "Рослинна олія", "Оцет", "Соєвий соус", "Часник", "Цибуля"],
  fa: ["روغن زیتون", "نمک", "فلفل", "شکر", "آرد", "برنج", "پاستا", "روغن نباتی", "سرکه", "سس سویا", "سیر", "پیاز"],
  zh: ["橄榄油", "盐", "胡椒", "糖", "面粉", "大米", "面食", "植物油", "醋", "酱油", "大蒜", "洋葱"],
  vi: ["Dầu ô liu", "Muối", "Tiêu", "Đường", "Bột mì", "Gạo", "Mì", "Dầu thực vật", "Giấm", "Nước tương", "Tỏi", "Hành tây"],
  tr: ["Zeytinyağı", "Tuz", "Biber", "Şeker", "Un", "Pirinç", "Makarna", "Bitkisel yağ", "Sirke", "Soya sosu", "Sarımsak", "Soğan"],
};

const PANTRY_STRINGS = {
  en: { title: "🥫 My Pantry", desc: "Save staples you already have to lower your grocery bill", descItems: "item(s) saved — won't be bought again", quickAdd: "Quick add common staples:", placeholder: "e.g. olive oil", amount: "Amount", addBtn: "Add to Pantry" },
  de: { title: "🥫 Mein Vorratsschrank", desc: "Spare Grundzutaten, die du schon hast, um Einkaufskosten zu senken", descItems: "Artikel gespeichert — werden nicht nachgekauft", quickAdd: "Häufige Grundzutaten schnell hinzufügen:", placeholder: "z.B. Olivenöl", amount: "Menge", addBtn: "Hinzufügen" },
  fr: { title: "🥫 Mon Garde-manger", desc: "Enregistrez les aliments que vous avez déjà pour réduire la facture", descItems: "article(s) enregistré(s) — ne sera pas racheté", quickAdd: "Ajout rapide d'aliments courants :", placeholder: "ex. huile d'olive", amount: "Quantité", addBtn: "Ajouter" },
  es: { title: "🥫 Mi Despensa", desc: "Guarda lo que ya tienes para reducir tu factura de compras", descItems: "artículo(s) guardado(s) — no se comprará de nuevo", quickAdd: "Añadir rápido alimentos básicos:", placeholder: "ej. aceite de oliva", amount: "Cantidad", addBtn: "Añadir" },
  ar: { title: "🥫 مخزني", desc: "احفظ المواد الأساسية التي لديك لتقليل فاتورة التسوق", descItems: "عنصر/عناصر محفوظة — لن يتم شراؤها مجدداً", quickAdd: "إضافة سريعة للمواد الشائعة:", placeholder: "مثلاً زيت الزيتون", amount: "الكمية", addBtn: "أضف للمخزن" },
  ru: { title: "🥫 Моя кладовая", desc: "Сохраните продукты, которые уже есть, чтобы снизить расходы", descItems: "товар(ов) сохранено — не будут куплены снова", quickAdd: "Быстро добавить распространённые продукты:", placeholder: "напр. оливковое масло", amount: "Количество", addBtn: "В кладовую" },
  uk: { title: "🥫 Моя комора", desc: "Збережіть продукти, які вже є, щоб знизити витрати", descItems: "товар(ів) збережено — не купуватимуться знову", quickAdd: "Швидко додати поширені продукти:", placeholder: "напр. оливкова олія", amount: "Кількість", addBtn: "До комори" },
  fa: { title: "🥫 انبار من", desc: "موادی که دارید ذخیره کنید تا هزینه خرید کاهش یابد", descItems: "آیتم ذخیره شده — دوباره خریداری نمی‌شود", quickAdd: "افزودن سریع مواد رایج:", placeholder: "مثلاً روغن زیتون", amount: "مقدار", addBtn: "به انبار اضافه کن" },
  zh: { title: "🥫 我的储物柜", desc: "保存已有食材以降低购物费用", descItems: "件已保存 — 不会再购买", quickAdd: "快速添加常用食材：", placeholder: "如橄榄油", amount: "数量", addBtn: "加入储物柜" },
  vi: { title: "🥫 Kho Thực Phẩm", desc: "Lưu nguyên liệu sẵn có để giảm chi phí mua sắm", descItems: "mặt hàng đã lưu — sẽ không mua lại", quickAdd: "Thêm nhanh các thực phẩm phổ biến:", placeholder: "vd. dầu ô liu", amount: "Số lượng", addBtn: "Thêm vào kho" },
  tr: { title: "🥫 Kilerим", desc: "Elinizdekileri kaydedin, alışveriş masrafını azaltın", descItems: "ürün kaydedildi — tekrar satın alınmayacak", quickAdd: "Yaygın malzemeleri hızlı ekle:", placeholder: "örn. zeytinyağı", amount: "Miktar", addBtn: "Kilere Ekle" },
};

export default function PantryManager({ onPantryChange }) {
  const { currentLanguage } = useLanguage();
  const s = PANTRY_STRINGS[currentLanguage?.code] || PANTRY_STRINGS.en;
  const quickAdds = QUICK_ADDS[currentLanguage?.code] || QUICK_ADDS.en;
  const [items, setItems] = useState([]);
  const [nameInput, setNameInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      if (!isAuthed) {
        // Fall back to localStorage for unauthenticated users
        const stored = JSON.parse(localStorage.getItem("pantry_items") || "[]");
        setItems(stored);
        onPantryChange?.(stored);
        return;
      }
      const data = await base44.entities.PantryItem.list();
      setItems(data);
      onPantryChange?.(data);
    } catch {
      const stored = JSON.parse(localStorage.getItem("pantry_items") || "[]");
      setItems(stored);
      onPantryChange?.(stored);
    }
  };

  const saveToLocalStorage = (newItems) => {
    localStorage.setItem("pantry_items", JSON.stringify(newItems));
  };

  const addItem = async () => {
    const name = nameInput.trim();
    const amount = amountInput.trim();
    if (!name) return;

    setLoading(true);
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      let newItem;
      if (isAuthed) {
        newItem = await base44.entities.PantryItem.create({ name, amount: amount || "some" });
      } else {
        newItem = { id: Date.now().toString(), name, amount: amount || "some" };
        const newItems = [...items, newItem];
        saveToLocalStorage(newItems);
      }
      const newItems = [...items, newItem];
      setItems(newItems);
      onPantryChange?.(newItems);
      setNameInput("");
      setAmountInput("");
    } catch {
      // silent
    }
    setLoading(false);
  };

  const removeItem = async (item) => {
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      if (isAuthed && !item.id?.toString().includes("Date")) {
        await base44.entities.PantryItem.delete(item.id);
      }
    } catch {
      // silent
    }
    const newItems = items.filter(i => i.id !== item.id);
    setItems(newItems);
    saveToLocalStorage(newItems);
    onPantryChange?.(newItems);
  };

  const addQuick = async (name) => {
    if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) return;
    setLoading(true);
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      let newItem;
      if (isAuthed) {
        newItem = await base44.entities.PantryItem.create({ name, amount: "some" });
      } else {
        newItem = { id: Date.now().toString() + Math.random(), name, amount: "some" };
        const newItems = [...items, newItem];
        saveToLocalStorage(newItems);
      }
      const newItems = [...items, newItem];
      setItems(newItems);
      onPantryChange?.(newItems);
    } catch {
      // silent
    }
    setLoading(false);
  };

  return (
    <div className={`rounded-xl border-2 transition-all duration-200 ${items.length > 0 ? "bg-green-50 border-green-400" : "bg-card border-border"}`}>
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <Package className={`h-5 w-5 ${items.length > 0 ? "text-green-700" : "text-muted-foreground"}`} />
          <div className="text-left">
            <p className={`text-sm font-semibold ${items.length > 0 ? "text-green-800" : "text-foreground"}`}>
              {s.title}
            </p>
            <p className={`text-xs ${items.length > 0 ? "text-green-700/70" : "text-muted-foreground"}`}>
              {items.length > 0
                ? `${items.length} ${s.descItems}`
                : s.desc}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
              -{items.length} items
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Current pantry items */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {items.map(item => (
                <span key={item.id} className="flex items-center gap-1 bg-green-100 text-green-800 border border-green-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  {item.name}{item.amount && item.amount !== "some" ? ` (${item.amount})` : ""}
                  <button onClick={() => removeItem(item)}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}

          {/* Quick add suggestions */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">{s.quickAdd}</p>
            <div className="flex flex-wrap gap-1.5">
              {quickAdds.filter(q => !items.some(i => i.name.toLowerCase() === q.toLowerCase())).map(q => (
                <button
                  key={q}
                  onClick={() => addQuick(q)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-muted-foreground transition-colors"
                >
                  + {q}
                </button>
              ))}
            </div>
          </div>

          {/* Add custom item */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 min-w-0">
              <input
                className="min-w-0 flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder={s.placeholder}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem()}
              />
              <input
                className="w-20 shrink-0 border border-border rounded-xl px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder={s.amount}
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem()}
              />
            </div>
            <button
              onClick={addItem}
              disabled={!nameInput.trim() || loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {s.addBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}