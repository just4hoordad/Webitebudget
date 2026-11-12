import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// A mobile-only sticky action bar that slides + fades in smoothly
// instead of popping into view. Always mounted (fixed, no layout impact);
// visibility is toggled via the `visible` prop with a CSS transition.
export default function StickyGenerateBar({ visible, onClick, disabled, label, icon: Icon = ArrowRight }) {
  return (
    <div
      className={`md:hidden fixed left-3 right-3 z-40 transition-all duration-300 ease-out ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-6 pointer-events-none"
      }`}
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 80px)" }}
    >
      <Button
        onClick={onClick}
        disabled={disabled}
        variant="destructive"
        className="w-full h-12 text-sm"
        size="lg"
      >
        {label}
        <Icon className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}