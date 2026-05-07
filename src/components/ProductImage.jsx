import { useState } from "react";

// Category emoji fallbacks based on common food categories
const FALLBACK_EMOJI = "🛒";

export default function ProductImage({ name, imageUrl, onClick }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div className="w-10 h-10 rounded-lg bg-muted border border-border shrink-0 flex items-center justify-center">
        <span className="text-base">{FALLBACK_EMOJI}</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-muted border border-border cursor-zoom-in hover:opacity-80 transition-opacity"
      onClick={() => onClick && onClick(imageUrl)}
      onError={() => setFailed(true)}
    />
  );
}