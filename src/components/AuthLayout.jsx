import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-background">
      {/* Soft decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(45% 50% at 15% 8%, hsl(var(--primary) / 0.10) 0%, transparent 60%)," +
            "radial-gradient(40% 45% at 88% 92%, hsl(var(--primary) / 0.08) 0%, transparent 60%)," +
            "radial-gradient(30% 30% at 80% 12%, hsl(var(--chart-2) / 0.06) 0%, transparent 55%)",
        }}
      />

      <div className="w-full max-w-md">
        {/* Brand lockup */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 select-none">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center bb-shadow-glow">
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-foreground">
            Budget<span className="text-primary">Bite</span>
          </span>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10 mb-4">
            {Icon && <Icon className="w-7 h-7 text-primary" aria-hidden="true" />}
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-xs mx-auto">{subtitle}</p>}
        </div>

        <div className="bg-card rounded-3xl bb-shadow-lg border border-border p-8">
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}