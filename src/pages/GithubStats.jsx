import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Star, GitFork, Eye, AlertCircle, GitCommit, Tag, Users, ExternalLink, Search } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color = "text-primary" }) => (
  <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
    <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0`}>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading font-bold text-xl text-foreground">{value ?? "—"}</p>
    </div>
  </div>
);

export default function GithubStats() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetch = async () => {
    if (!owner.trim() || !repo.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await base44.functions.invoke("getGithubStats", { owner: owner.trim(), repo: repo.trim() });
      setData(res.data);
    } catch (e) {
      setError(e.message || "Failed to fetch stats.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-1">GitHub Repository Stats</h1>
        <p className="text-muted-foreground text-sm">Statistiken für ein GitHub-Repository abrufen</p>
      </div>

      {/* Input */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Owner (z.B. hoordad)"
            value={owner}
            onChange={e => setOwner(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleFetch()}
            className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <span className="flex items-center text-muted-foreground font-bold">/</span>
          <input
            type="text"
            placeholder="Repository (z.B. budgetbite)"
            value={repo}
            onChange={e => setRepo(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleFetch()}
            className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <Button onClick={handleFetch} disabled={loading || !owner || !repo} className="w-full gap-2">
          <Search className="h-4 w-4" />
          {loading ? "Lade Daten..." : "Statistiken abrufen"}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Repo Header */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-lg text-foreground">{data.repo.full_name}</h2>
                {data.repo.description && <p className="text-sm text-muted-foreground mt-1">{data.repo.description}</p>}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {data.repo.language && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{data.repo.language}</span>
                  )}
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{data.repo.visibility}</span>
                  <span className="text-xs text-muted-foreground">Branch: {data.repo.default_branch}</span>
                </div>
              </div>
              <a href={data.repo.html_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
                <ExternalLink className="h-3.5 w-3.5" /> GitHub
              </a>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Star} label="Stars" value={data.repo.stars} />
            <StatCard icon={GitFork} label="Forks" value={data.repo.forks} />
            <StatCard icon={Eye} label="Watchers" value={data.repo.watchers} />
            <StatCard icon={AlertCircle} label="Open Issues" value={data.repo.open_issues} color="text-orange-500" />
            <StatCard icon={GitCommit} label="Commits (gesamt)" value={data.totalCommits} color="text-violet-500" />
            <StatCard icon={Users} label="Top Contributors" value={data.contributors.length} color="text-blue-500" />
          </div>

          {/* Contributors */}
          {data.contributors.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Top Contributors</h3>
              <div className="space-y-2">
                {data.contributors.map(c => (
                  <a key={c.login} href={c.html_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 transition-colors">
                    <img src={c.avatar_url} alt={c.login} className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-medium text-foreground flex-1">{c.login}</span>
                    <span className="text-xs text-muted-foreground">{c.contributions} commits</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Releases */}
          {data.releases.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Letzte Releases</h3>
              <div className="space-y-2">
                {data.releases.map(r => (
                  <a key={r.tag} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between hover:bg-muted/50 rounded-lg p-2 transition-colors">
                    <span className="text-sm font-medium text-foreground">{r.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(r.published_at).toLocaleDateString("de-DE")}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}