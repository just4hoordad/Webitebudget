import { UtensilsCrossed, Combine, ShoppingBag, BookOpenCheck } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getVisualCopy } from "@/lib/visualStoryCopy";
import {
  PlanScenePickMeals,
  PlanSceneMerge,
  PlanSceneCheapestBag,
  PlanScenePrepCook,
} from "./PlanBuilderScenes";
import StoryStagePlayer from "./StoryStagePlayer";

const PLAN_STAGE_META = [
  { icon: UtensilsCrossed, bg: "bg-[#FF8FB5]", cardTint: "bg-[#FFF1F5]", Scene: PlanScenePickMeals },
  { icon: Combine, bg: "bg-[#C084FC]", cardTint: "bg-[#FAF5FF]", Scene: PlanSceneMerge },
  { icon: ShoppingBag, bg: "bg-[#7DD3FC]", cardTint: "bg-[#F0F9FF]", Scene: PlanSceneCheapestBag },
  { icon: BookOpenCheck, bg: "bg-[#78a71b]", cardTint: "bg-[#F3F8E6]", Scene: PlanScenePrepCook },
];

export default function PlanBuilderFlowVisual() {
  const { currentLanguage } = useLanguage();
  const copy = getVisualCopy(currentLanguage?.code);

  return (
    <StoryStagePlayer
      stages={copy.planStages}
      stageMeta={PLAN_STAGE_META}
      headerLabel={copy.planBadge}
      replayLabel={copy.heroReplay}
      ariaLabel="Animated visual guide for Plan Builder"
      activePath="/plan-builder"
      wide
    />
  );
}