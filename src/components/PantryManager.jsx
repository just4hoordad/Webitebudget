import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Package, Plus, X, ChevronDown, ChevronUp } from "lucide-react";

const QUICK_ADDS = [
  "Olive oil", "Salt", "Pepper", "Sugar", "Flour", "Rice", "Pasta",
  "Vegetable oil", "Vinegar", "Soy sauce", "Garlic", "Onions",
];

export default function PantryManager({ onPantryChange }) {
  const [items, setItems] = useState([]);
  const [nameInput, setNameInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      if (!isAuthed) {
        // Fall back to localStorage for unauthenticated users
        const stored = JSON.parse(localStorage.getItem("pantry_items") || "[]");
        setItems(stored);
        onPantryChange?.(stored);
        return;
      }
      const data = await base44.entities.PantryItem.list();
      setItems(data);
      onPantryChange?.(data);
    } catch {
      const stored = JSON.parse(localStorage.getItem("pantry_items") || "[]");
      setItems(stored);
      onPantryChange?.(stored);
    }
  };

  const saveToLocalStorage = (newItems) => {
    localStorage.setItem("pantry_items", JSON.stringify(newItems));
  };

  const addItem = async () => {
    const name = nameInput.trim();
    const amount = amountInput.trim();
    if (!name) return;

    setLoading(true);
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      let newItem;
      if (isAuthed) {
        newItem = await base44.entities.PantryItem.create({ name, amount: amount || "some" });
      } else {
        newItem = { id: Date.now().toString(), name, amount: amount || "some" };
        const newItems = [...items, newItem];
        saveToLocalStorage(newItems);
      }
      const newItems = [...items, newItem];
      setItems(newItems);
      onPantryChange?.(newItems);
      setNameInput("");
      setAmountInput("");
    } catch {
      // silent
    }
    setLoading(false);
  };

  const removeItem = async (item) => {
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      if (isAuthed && !item.id?.toString().includes("Date")) {
        await base44.entities.PantryItem.delete(item.id);
      }
    } catch {
      // silent
    }
    const newItems = items.filter(i => i.id !== item.id);
    setItems(newItems);
    saveToLocalStorage(newItems);
    onPantryChange?.(newItems);
  };

  const addQuick = async (name) => {
    if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) return;
    setLoading(true);
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      let newItem;
      if (isAuthed) {
        newItem = await base44.entities.PantryItem.create({ name, amount: "some" });
      } else {
        newItem = { id: Date.now().toString() + Math.random(), name, amount: "some" };
        const newItems = [...items, newItem];
        saveToLocalStorage(newItems);
      }
      const newItems = [...items, newItem];
      setItems(newItems);
      onPantryChange?.(newItems);
    } catch {
      // silent
    }
    setLoading(false);
  };

  return (
    <div className={`rounded-xl border-2 transition-all duration-200 ${items.length > 0 ? "bg-green-50 border-green-400" : "bg-card border-border"}`}>
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <Package className={`h-5 w-5 ${items.length > 0 ? "text-green-700" : "text-muted-foreground"}`} />
          <div className="text-left">
            <p className={`text-sm font-semibold ${items.length > 0 ? "text-green-800" : "text-foreground"}`}>
              🥫 My Pantry
            </p>
            <p className={`text-xs ${items.length > 0 ? "text-green-700/70" : "text-muted-foreground"}`}>
              {items.length > 0
                ? `${items.length} item${items.length !== 1 ? "s" : ""} saved — won't be bought again`
                : "Save staples you already have to lower your grocery bill"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
              -{items.length} items
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Current pantry items */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {items.map(item => (
                <span key={item.id} className="flex items-center gap-1 bg-green-100 text-green-800 border border-green-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  {item.name}{item.amount && item.amount !== "some" ? ` (${item.amount})` : ""}
                  <button onClick={() => removeItem(item)}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}

          {/* Quick add suggestions */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Quick add common staples:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ADDS.filter(q => !items.some(i => i.name.toLowerCase() === q.toLowerCase())).map(q => (
                <button
                  key={q}
                  onClick={() => addQuick(q)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-muted-foreground transition-colors"
                >
                  + {q}
                </button>
              ))}
            </div>
          </div>

          {/* Add custom item */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 min-w-0">
              <input
                className="min-w-0 flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. olive oil"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem()}
              />
              <input
                className="w-20 shrink-0 border border-border rounded-xl px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Amount"
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem()}
              />
            </div>
            <button
              onClick={addItem}
              disabled={!nameInput.trim() || loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Add to Pantry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}