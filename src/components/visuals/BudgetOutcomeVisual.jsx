import { SlidersHorizontal, ScanBarcode, CalendarCheck2, ChefHat } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getVisualCopy } from "@/lib/visualStoryCopy";
import {
  BudgetSceneCap,
  BudgetSceneScan,
  BudgetSceneCalendar,
  BudgetSceneDeliverable,
} from "./BudgetBuilderScenes";
import StoryStagePlayer from "./StoryStagePlayer";

const BUDGET_STAGE_META = [
  { icon: SlidersHorizontal, bg: "bg-[#FFB020]", cardTint: "bg-[#FFFBEB]", Scene: BudgetSceneCap },
  { icon: ScanBarcode, bg: "bg-[#7DD3FC]", cardTint: "bg-[#F0F9FF]", Scene: BudgetSceneScan },
  { icon: CalendarCheck2, bg: "bg-[#C084FC]", cardTint: "bg-[#FAF5FF]", Scene: BudgetSceneCalendar },
  { icon: ChefHat, bg: "bg-[#78a71b]", cardTint: "bg-[#F3F8E6]", Scene: BudgetSceneDeliverable },
];

export default function BudgetOutcomeVisual() {
  const { currentLanguage } = useLanguage();
  const copy = getVisualCopy(currentLanguage?.code);

  return (
    <StoryStagePlayer
      stages={copy.budgetStages}
      stageMeta={BUDGET_STAGE_META}
      headerLabel={copy.budgetBadge}
      replayLabel={copy.heroReplay}
      ariaLabel="Animated visual guide for Budget Mode"
      activePath="/budget"
      wide
    />
  );
}