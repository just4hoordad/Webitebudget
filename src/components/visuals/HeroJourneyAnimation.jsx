import { Wallet, ClipboardList, Refrigerator, Utensils } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getVisualCopy } from "@/lib/visualStoryCopy";
import { SceneMoney, SceneList, SceneFridge, SceneMeals } from "./HeroJourneyScenes";
import StoryStagePlayer from "./StoryStagePlayer";

const STAGE_META = [
  { icon: Wallet, bg: "bg-[#FFB020]", cardTint: "bg-[#FFFBEB]", Scene: SceneMoney },
  { icon: ClipboardList, bg: "bg-[#7DD3FC]", cardTint: "bg-[#F0F9FF]", Scene: SceneList },
  { icon: Refrigerator, bg: "bg-[#C084FC]", cardTint: "bg-[#FAF5FF]", Scene: SceneFridge },
  { icon: Utensils, bg: "bg-[#78a71b]", cardTint: "bg-[#F3F8E6]", Scene: SceneMeals },
];

export default function HeroJourneyAnimation({ onInteract }) {
  const { currentLanguage } = useLanguage();
  const copy = getVisualCopy(currentLanguage?.code);

  return (
    <StoryStagePlayer
      stages={copy.heroStages}
      stageMeta={STAGE_META}
      replayLabel={copy.heroReplay}
      ariaLabel="Animated story from budget to cooked meals"
      activePath="/"
      onInteract={onInteract}
    />
  );
}