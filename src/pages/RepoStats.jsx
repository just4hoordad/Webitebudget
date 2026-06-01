import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, GitFork, AlertCircle, GitCommit, Users, Tag, Calendar, Code } from "lucide-react";
import { format } from "date-fns";

function StatCard({ icon: Icon, label, value, color = "text-primary" }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-heading font-bold text-xl text-foreground">{value ?? "—"}</p>
      </div>
    </div>
  );
}

export default function RepoStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.functions.invoke("getRepoStats", {})
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || data?.error) {
    return (
      <div className="text-center py-12 text-destructive">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p className="font-medium">{error || data?.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{data.name}</h1>
        {data.description && (
          <p className="text-muted-foreground text-sm mt-1">{data.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {data.language && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              <Code className="h-3 w-3" /> {data.language}
            </span>
          )}
          {data.updatedAt && (
            <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
              <Calendar className="h-3 w-3" /> Updated {format(new Date(data.updatedAt), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Star} label="Stars" value={data.stars} />
        <StatCard icon={GitFork} label="Forks" value={data.forks} />
        <StatCard icon={AlertCircle} label="Open Issues" value={data.openIssues} />
        <StatCard icon={GitCommit} label="Total Commits" value={data.totalCommits ?? "100+"} />
      </div>

      {/* Contributors */}
      {data.contributors?.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-base mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Contributors
          </h2>
          <div className="space-y-2">
            {data.contributors.map(c => (
              <a
                key={c.login}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 transition-colors"
              >
                <img src={c.avatar} alt={c.login} className="w-8 h-8 rounded-full" />
                <span className="font-medium text-sm flex-1">{c.login}</span>
                <span className="text-xs text-muted-foreground">{c.contributions} commits</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Releases */}
      {data.releases?.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-base mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> Recent Releases
          </h2>
          <div className="space-y-2">
            {data.releases.map(r => (
              <div key={r.tag} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
                <span className="font-medium text-sm">{r.name}</span>
                <span className="text-xs text-muted-foreground">
                  {r.publishedAt ? format(new Date(r.publishedAt), "MMM d, yyyy") : r.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}