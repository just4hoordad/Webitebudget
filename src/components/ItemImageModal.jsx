import { useEffect, useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function ItemImageModal({ item, onClose }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const generateImage = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.GenerateImage({
      prompt: `Realistic clean product photo of this grocery item sold in a German supermarket: ${item.name}. Show the item clearly on a plain bright background, helpful for shoppers to recognize it. No text overlays, no people.`
    });
    setImageUrl(result.url);
    setLoading(false);
  };

  useEffect(() => {
    generateImage();
  }, [item.name]);

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
          <div className="aspect-square rounded-2xl bg-muted overflow-hidden flex items-center justify-center">
            {loading ? (
              <div className="text-center space-y-3 px-6">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Creating item picture…</p>
              </div>
            ) : (
              <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border bg-muted/40 flex justify-end">
          <Button onClick={generateImage} disabled={loading} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Regenerate picture
          </Button>
        </div>
      </motion.div>
    </div>
  );
}