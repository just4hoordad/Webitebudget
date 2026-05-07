import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Simple in-memory cache to avoid re-fetching same product
const imageCache = {};

export default function ProductImage({ name, onClick }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) { setLoading(false); return; }

    if (imageCache[name] !== undefined) {
      setImgSrc(imageCache[name]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    base44.functions.invoke('proxyImage', { productName: name })
      .then(res => {
        if (cancelled) return;
        const url = res?.data?.imageUrl || null;
        imageCache[name] = url;
        setImgSrc(url);
      })
      .catch(() => {
        if (!cancelled) imageCache[name] = null;
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [name]);

  if (loading) {
    return <div className="w-10 h-10 rounded-lg bg-muted border border-border shrink-0 animate-pulse" />;
  }

  if (!imgSrc) {
    return (
      <div className="w-10 h-10 rounded-lg bg-muted border border-border shrink-0 flex items-center justify-center">
        <span className="text-base">🛒</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={name}
      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-muted border border-border cursor-zoom-in hover:opacity-80 transition-opacity"
      onClick={() => onClick && onClick(imgSrc)}
      onError={() => setImgSrc(null)}
    />
  );
}