import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const imageCache = {};

export default function ProductImage({ name, imageUrl, onClick }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) { setLoading(false); return; }

    // If we already have a cached result, use it
    const cacheKey = name;
    if (imageCache[cacheKey] !== undefined) {
      setImgSrc(imageCache[cacheKey]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const tryLoad = async () => {
      // 1. Try the LLM-provided image_url first (actual product image)
      if (imageUrl) {
        const ok = await testImage(imageUrl);
        if (!cancelled && ok) {
          imageCache[cacheKey] = imageUrl;
          setImgSrc(imageUrl);
          setLoading(false);
          return;
        }
      }

      // 2. Fall back to Open Food Facts / Wikipedia via proxy
      try {
        const res = await base44.functions.invoke('proxyImage', { productName: name });
        if (!cancelled) {
          const url = res?.data?.imageUrl || null;
          imageCache[cacheKey] = url;
          setImgSrc(url);
        }
      } catch {
        if (!cancelled) imageCache[cacheKey] = null;
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    tryLoad();
    return () => { cancelled = true; };
  }, [name, imageUrl]);

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
      onError={() => { imageCache[name] = null; setImgSrc(null); }}
    />
  );
}

// Returns true if the image URL loads successfully
function testImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    // Timeout after 4s
    setTimeout(() => resolve(false), 4000);
  });
}