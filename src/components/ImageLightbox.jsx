import { X } from "lucide-react";
import { motion } from "framer-motion";

export default function ImageLightbox({ src, alt, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="relative max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 bg-card border border-border rounded-full p-1.5 text-muted-foreground hover:text-foreground shadow-lg"
        >
          <X className="h-4 w-4" />
        </button>
        <img
          src={src}
          alt={alt}
          className="w-full rounded-2xl shadow-2xl object-contain max-h-[70vh]"
        />
        <p className="text-center text-sm text-white/80 mt-3 font-medium">{alt}</p>
      </motion.div>
    </div>
  );
}