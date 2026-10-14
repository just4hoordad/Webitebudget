import { Heart } from "lucide-react";

export default function SupportUsButton({ onClick, variant = "sidebar" }) {
  if (variant === "sheet") {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 font-semibold text-sm hover:bg-rose-100 transition-colors"
      >
        <Heart className="h-5 w-5" /> Support Us ❤️
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-colors w-full"
    >
      <Heart className="h-4 w-4" /> Support Us ❤️
    </button>
  );
}