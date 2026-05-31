import { useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { pageTranslations } from "@/lib/translations_pages";

export default function Contact() {
  const { currentLanguage } = useLanguage();
  const p = pageTranslations[currentLanguage.code] || pageTranslations["en"];
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: "Hoordad.sedaghat@gmail.com",
      subject: `Contact from ${form.name} <${form.email}>`,
      body: form.message,
    });
    setSending(false);
    setSent(true);
    toast.success(p.contactToast);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">{p.contactTitle}</h1>
        <p className="text-muted-foreground text-base leading-relaxed">{p.contactSubtitle}</p>
      </div>

      {/* Email */}
      <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4">
        <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{p.contactOwnerLabel}</p>
          <a href="mailto:Hoordad.sedaghat@gmail.com" className="font-heading font-semibold text-primary hover:underline">
            Hoordad.sedaghat@gmail.com
          </a>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-heading font-semibold text-sm">{p.contactSendMessage}</span>
        </div>
        {sent ? (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-heading font-semibold text-foreground">{p.contactSentTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">{p.contactSentDesc}</p>
            <button onClick={() => setSent(false)} className="text-xs text-primary underline mt-3">{p.contactSentAgain}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder={p.contactNamePH}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              type="email"
              placeholder={p.contactEmailPH}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <textarea
              placeholder={p.contactMsgPH}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
              rows={4}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            <Button type="submit" disabled={sending} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {sending ? p.contactSending : p.contactSendBtn}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}