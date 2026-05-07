import { useEffect, useState } from "react";
import { X, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function ItemImageModal({ item, onClose }) {
  const [imageUrl, setImageUrl] = useState(item.image_url || null);
  const [sourceUrl, setSourceUrl] = useState(item.source_url || null);
  const [loading, setLoading] = useState(true);

  const findProductImage = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Find a real product image for this grocery item sold in German supermarkets: ${item.name}. Prefer official shop or product pages from Aldi, Lidl, REWE, Edeka, dm, Rossmann, Kaufland, or manufacturer pages. Return only a real direct image URL and the source page URL. Do not invent URLs.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          image_url: { type: "string" },
          source_url: { type: "string" }
        }
      }
    });
    setImageUrl(result.image_url || null);
    setSourceUrl(result.source_url || null);
    setLoading(false);
  };

  useEffect(() => {
    setImageUrl(item.image_url || null);
    setSourceUrl(item.source_url || null);
    if (item.image_url) {
      setLoading(false);
    } else {
      findProductImage();
    }
  }, [item.name, item.image_url, item.source_url]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-16 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wide">Item picture</p>
            <h2 className="font-heading font-bold text-foreground mt-0.5">{item.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{item.quantity}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="relative aspect-square rounded-2xl bg-muted overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setImageUrl(null);
                  setLoading(false);
                }}
              />
            ) : (
              <div className="text-center space-y-3 px-6">
                <ImageOff className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No real shop image found for this item.</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border bg-muted/40 flex items-center justify-between gap-3">
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
              View source
            </a>
          ) : <span />}
          <span className="text-xs text-muted-foreground">Real web image only</span>
        </div>
      </motion.div>
    </div>
  );
}