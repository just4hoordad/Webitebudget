import { useState } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Clock, Users, ChefHat, Check } from "lucide-react";

export default function CookModeView({ recipe, onClose, L }) {
  const [step, setStep] = useState(0);
  const [checkedSteps, setCheckedSteps] = useState(new Set());
  const totalSteps = Array.isArray(recipe.steps) ? recipe.steps.length : 0;
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const toggleCheck = (i) =>
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const goNext = () => step < totalSteps - 1 && setStep(step + 1);
  const goPrev = () => step > 0 && setStep(step - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative bg-card border-[3px] border-[#111827] dark:border-[#78a71b] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg flex flex-col shadow-[6px_6px_0_#111827] overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#FFB020] text-[#111827] border-b-[3px] border-[#111827] px-5 py-4 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <span className="bba-sticker mb-1">
              <ChefHat className="h-3.5 w-3.5" /> {L("cookMode")}
            </span>
            <h2 className="font-heading font-black text-lg text-[#111827] mt-0.5 line-clamp-1">{recipe.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center text-[#111827] shrink-0 ml-3">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Quick stats */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            {totalTime > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                {totalTime} min
              </span>
            )}
            {recipe.servings > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                {recipe.servings} {L("servings")}
              </span>
            )}
          </div>

          {/* Ingredients checklist */}
          {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
            <div className="bg-muted/40 rounded-xl p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{L("ingredients")}</h3>
              <div className="space-y-1">
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} className="flex justify-between gap-3 text-sm">
                    <span className="text-foreground">{ing.name}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">{ing.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current step */}
          {totalSteps > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {L("stepOf").replace("{n}", step + 1).replace("{total}", totalSteps)}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-border"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div
                className="bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] shadow-[3px_3px_0_#111827] rounded-2xl p-5 cursor-pointer"
                onClick={() => toggleCheck(step)}
              >
                <p className="text-sm font-medium leading-relaxed text-[#111827] dark:text-foreground">{recipe.steps[step]}</p>
                {checkedSteps.has(step) && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs bg-[#78a71b] text-[#111827] border border-[#111827] px-2.5 py-0.5 rounded-full font-heading font-black">
                    <Check className="h-3.5 w-3.5" /> Done
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {recipe.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800 leading-relaxed">{recipe.notes}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        {totalSteps > 1 && (
          <div className="sticky bottom-0 bg-card border-t border-border px-5 py-3 flex items-center gap-3 shrink-0">
            <button
              onClick={goPrev}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" /> {L("prevStep")}
            </button>
            <button
              onClick={goNext}
              disabled={step === totalSteps - 1}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {L("nextStep")} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}