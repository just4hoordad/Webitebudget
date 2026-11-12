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
    try {
      const res = await base44.functions.invoke("sendContactEmail", {
        name: form.name,
        email: form.email,
        message: form.message,
      });
      if (res.data?.error) {
        throw new Error(res.data.error);
      }
      setSent(true);
      toast.success(p.contactToast);
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputClass = "w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25";

  return (
    <div className="max-w-xl mx-auto space-y-8 py-2">
      <div className="bba-t bg-[#FF8FB5] text-[#111827] space-y-2">
        <span className="bba-sticker">
          {p.contactSubtitle?.split(",")[0] || "Contact"}
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#111827] leading-tight tracking-tight">{p.contactTitle}</h1>
        <p className="text-[#111827]/85 font-medium text-sm sm:text-base leading-relaxed">{p.contactSubtitle}</p>
      </div>

      {/* Email */}
      <div className="flex items-center gap-4 bba-t bg-[#7DD3FC] px-5 py-4">
        <div className="bg-white border-2 border-[#111827] w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-[2px_2px_0_#111827]">
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
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 bb-shadow">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-heading font-semibold text-sm">{p.contactSendMessage}</span>
        </div>
        {sent ? (
          <div className="text-center py-8">
            <div className="h-14 w-14 rounded-full bg-primary/12 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✅</span>
            </div>
            <p className="font-heading font-semibold text-foreground text-lg">{p.contactSentTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">{p.contactSentDesc}</p>
            <button onClick={() => setSent(false)} className="text-xs text-primary underline mt-4">{p.contactSentAgain}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder={p.contactNamePH}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className={inputClass}
            />
            <input
              type="email"
              placeholder={p.contactEmailPH}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className={inputClass}
            />
            <textarea
              placeholder={p.contactMsgPH}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
              rows={4}
              className={`${inputClass} resize-none`}
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