import { useState } from "react";

export default function ProductImage({ url, name, onClick }) {
  const [failed, setFailed] = useState(false);

  const proxied = url ? `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=80&h=80&fit=cover` : null;

  if (!proxied || failed) {
    return (
      <div className="w-10 h-10 rounded-lg bg-muted border border-border shrink-0 flex items-center justify-center">
        <span className="text-lg">🛒</span>
      </div>
    );
  }

  return (
    <img
      src={proxied}
      alt={name}
      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-muted border border-border cursor-zoom-in hover:opacity-80 transition-opacity"
      onClick={onClick}
      onError={() => setFailed(true)}
    />
  );
}