import { useState } from "react";

const CATEGORY_EMOJIS = {
  milk: "🥛", dairy: "🧀", cheese: "🧀", yogurt: "🥛", butter: "🧈",
  egg: "🥚", eggs: "🥚",
  meat: "🥩", chicken: "🍗", beef: "🥩", pork: "🥩", fish: "🐟", seafood: "🦐",
  bread: "🍞", bakery: "🍞", pasta: "🍝", rice: "🍚", grain: "🌾", cereal: "🥣",
  fruit: "🍎", apple: "🍎", banana: "🍌", orange: "🍊", berry: "🍓",
  vegetable: "🥦", carrot: "🥕", tomato: "🍅", potato: "🥔", onion: "🧅",
  oil: "🫙", olive: "🫒",
  coffee: "☕", tea: "🍵",
  water: "💧", juice: "🧃", drink: "🥤",
  sugar: "🍬", chocolate: "🍫", sweet: "🍫", snack: "🍿",
  sauce: "🫙", condiment: "🫙", spice: "🌶️",
  frozen: "🧊", ice: "🧊",
  nut: "🥜", bean: "🫘", lentil: "🫘",
  herb: "🌿", salad: "🥗",
  soap: "🧴", hygiene: "🧴", cleaning: "🧹",
};

function getEmojiForName(name) {
  if (!name) return "🛒";
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "🛒";
}

export default function ProductImage({ url, name, onClick }) {
  const [failed, setFailed] = useState(false);

  const proxied = url && !failed
    ? `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=80&h=80&fit=cover&output=jpg`
    : null;

  if (!proxied) {
    const emoji = getEmojiForName(name);
    return (
      <div
        className="w-10 h-10 rounded-lg bg-muted border border-border shrink-0 flex items-center justify-center cursor-default"
        title={name}
      >
        <span className="text-xl">{emoji}</span>
      </div>
    );
  }

  return (
    <img
      src={proxied}
      alt={name}
      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-muted border border-border cursor-zoom-in hover:opacity-80 transition-opacity"
      onClick={onClick}
      onError={() => setFailed(true)}
    />
  );
}