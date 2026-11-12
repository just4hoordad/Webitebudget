// Wrapper for a stat card: title + subtitle on top, visual + stats below.
export default function StatCard({ title, subtitle, children }) {
  return (
    <article className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div>
        <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {children}
    </article>
  );
}