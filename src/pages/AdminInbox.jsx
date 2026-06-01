import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminInbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    const msgs = await base44.entities.ContactMessage.list('-created_date');
    setMessages(msgs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (msg) => {
    if (!msg.read) {
      await base44.entities.ContactMessage.update(msg.id, { read: true });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    }
    setSelected(msg);
  };

  const deleteMsg = async (id) => {
    await base44.entities.ContactMessage.delete(id);
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Contact Inbox</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl text-muted-foreground text-sm">
          No messages yet.
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              onClick={() => markRead(msg)}
              className={`cursor-pointer bg-card border rounded-xl px-5 py-4 transition-all hover:border-primary/40 ${
                selected?.id === msg.id ? 'border-primary' : 'border-border'
              } ${!msg.read ? 'border-l-4 border-l-primary' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {msg.read
                    ? <MailOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <Mail className="h-4 w-4 text-primary shrink-0" />}
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${!msg.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {msg.name} <span className="font-normal text-muted-foreground">— {msg.email}</span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.message}</p>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteMsg(msg.id); }}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {selected?.id === msg.id && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(msg.created_date).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}