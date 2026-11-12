import { Heart } from "lucide-react";

export default function SupportUsButton({ onClick, variant = "sidebar" }) {
  if (variant === "sheet") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#FF8FB5] text-[#111827] border-[2.5px] border-[#111827] shadow-[3px_3px_0_#111827] font-heading font-black text-xs active:translate-x-[1px] active:translate-y-[1px] transition-transform"
      >
        <Heart className="h-4 w-4 fill-[#FF3E7F]" /> Support Us ❤️
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl text-xs font-heading font-black bg-[#FF8FB5] text-[#111827] border-2 border-[#111827] shadow-[2.5px_2.5px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform w-full"
    >
      <Heart className="h-3.5 w-3.5 fill-[#FF3E7F]" /> Support Us ❤️
    </button>
  );
}