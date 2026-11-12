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
          <div className="h-10 w-10 rounded-xl bg-[#78a71b] border-[2.5px] border-[#111827] shadow-[3px_3px_0_#111827] flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-[#111827]" />
          </div>
          <span className="font-heading font-black text-xl tracking-tight text-foreground">
            Budget<span className="bg-[#FF3E7F] text-white px-1.5 py-0.5 rounded-lg border-2 border-[#111827] shadow-[2px_2px_0_#111827] ml-0.5 inline-block -rotate-2">Bite</span>
          </span>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFB020] border-[3px] border-[#111827] shadow-[3px_3px_0_#111827] mb-4">
            {Icon && <Icon className="w-7 h-7 text-[#111827]" aria-hidden="true" />}
          </div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground font-medium mt-2 text-sm leading-relaxed max-w-xs mx-auto">{subtitle}</p>}
        </div>

        <div className="bba-t bg-card p-8">
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}