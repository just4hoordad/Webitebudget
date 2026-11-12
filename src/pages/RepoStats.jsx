import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, GitFork, AlertCircle, GitCommit, Users, Tag, Calendar, Code } from "lucide-react";
import { format } from "date-fns";

function StatCard({ icon: Icon, label, value, bg = "bg-[#FFB020]" }) {
  return (
    <div className="bba-t bg-card p-4 flex items-center gap-3.5">
      <div className={`w-10 h-10 rounded-xl ${bg} border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0 text-[#111827]`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-heading font-bold text-muted-foreground">{label}</p>
        <p className="font-heading font-black text-xl text-foreground">{value ?? "—"}</p>
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
    <div className="max-w-3xl mx-auto space-y-5 py-2">
      {/* Header */}
      <div className="bba-t bg-[#78a71b] text-[#111827] space-y-2">
        <span className="bba-sticker">GitHub Arcade</span>
        <h1 className="font-heading text-2xl sm:text-3xl font-black text-[#111827]">{data.name}</h1>
        {data.description && (
          <p className="text-[#111827]/85 font-medium text-sm">{data.description}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {data.language && (
            <span className="flex items-center gap-1 text-xs bg-white text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 rounded-full font-heading font-black">
              <Code className="h-3 w-3" /> {data.language}
            </span>
          )}
          {data.updatedAt && (
            <span className="flex items-center gap-1 text-xs bg-[#FFB020] text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 rounded-full font-heading font-black">
              <Calendar className="h-3 w-3" /> Updated {format(new Date(data.updatedAt), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Star} label="Stars" value={data.stars} bg="bg-[#FFB020]" />
        <StatCard icon={GitFork} label="Forks" value={data.forks} bg="bg-[#7DD3FC]" />
        <StatCard icon={AlertCircle} label="Open Issues" value={data.openIssues} bg="bg-[#FF8FB5]" />
        <StatCard icon={GitCommit} label="Total Commits" value={data.totalCommits ?? "100+"} bg="bg-[#C084FC]" />
      </div>

      {/* Contributors */}
      {data.contributors?.length > 0 && (
        <div className="bba-t bg-card space-y-3">
          <h2 className="font-heading font-black text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Contributors
          </h2>
          <div className="space-y-2">
            {data.contributors.map(c => (
              <a
                key={c.login}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] rounded-2xl px-4 py-2.5 shadow-[2px_2px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
              >
                <img src={c.avatar} alt={c.login} className="w-8 h-8 rounded-full border-2 border-[#111827]" />
                <span className="font-heading font-extrabold text-sm flex-1 text-[#111827] dark:text-foreground">{c.login}</span>
                <span className="text-xs font-heading font-black bg-white text-[#111827] border border-[#111827] px-2.5 py-0.5 rounded-full">{c.contributions} commits</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Releases */}
      {data.releases?.length > 0 && (
        <div className="bba-t bg-card space-y-3">
          <h2 className="font-heading font-black text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> Recent Releases
          </h2>
          <div className="space-y-2">
            {data.releases.map(r => (
              <div key={r.tag} className="flex items-center justify-between bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] rounded-2xl px-4 py-2.5">
                <span className="font-heading font-extrabold text-sm text-[#111827] dark:text-foreground">{r.name}</span>
                <span className="text-xs font-heading font-bold text-muted-foreground">
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