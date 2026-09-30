import { useLanguage } from "@/lib/LanguageContext";

// Common configs nudge users toward identical signatures → more server-cache
// hits → far cheaper generations. Numbers stay language-agnostic; only the
// role word is translated.
const PRESETS = [
  { id: "student", role: "Student", budget: 150, days: 30, people: 1 },
  { id: "couple", role: "Couple", budget: 250, days: 30, people: 2 },
  { id: "family", role: "Family", budget: 400, days: 30, people: 4 },
  { id: "week", role: "Week", budget: 50, days: 7, people: 1 },
];

const ROLES = {
  en: { Student: "Student", Couple: "Couple", Family: "Family", Week: "Week", title: "Quick presets" },
  de: { Student: "Student", Couple: "Paar", Family: "Familie", Week: "Woche", title: "Schnellvorgaben" },
  fr: { Student: "Étudiant", Couple: "Couple", Family: "Famille", Week: "Semaine", title: "Préréglages" },
  es: { Student: "Estudiante", Couple: "Pareja", Family: "Familia", Week: "Semana", title: "Preajustes" },
  ar: { Student: "طالب", Couple: "زوجان", Family: "عائلة", Week: "أسبوع", title: "إعدادات سريعة" },
  ru: { Student: "Студент", Couple: "Пара", Family: "Семья", Week: "Неделя", title: "Быстрые шаблоны" },
  uk: { Student: "Студент", Couple: "Пара", Family: "Сім'я", Week: "Тиждень", title: "Швидкі шаблони" },
  fa: { Student: "دانشجو", Couple: "زوج", Family: "خانواده", Week: "هفته", title: "تنظیمات سریع" },
  zh: { Student: "学生", Couple: "情侣", Family: "家庭", Week: "一周", title: "快速预设" },
  vi: { Student: "Sinh viên", Couple: "Cặp đôi", Family: "Gia đình", Week: "Tuần", title: "Cài sẵn" },
  tr: { Student: "Öğrenci", Couple: "Çift", Family: "Aile", Week: "Hafta", title: "Hızlı önayarlar" },
};

export default function BudgetPresets({ budget, days, people, onApply }) {
  const { t, currentLanguage } = useLanguage();
  const L = ROLES[currentLanguage?.code] || ROLES.en;

  const isActive = (p) => budget === p.budget && days === p.days && people === p.people;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{L.title}</p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const active = isActive(p);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onApply(p)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {L[p.role]} · €{p.budget} · {p.days}d · {p.people}p
            </button>
          );
        })}
      </div>
    </div>
  );
}