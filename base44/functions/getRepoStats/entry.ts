import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OWNER = "Hourdad";
const REPO = "webitebudget";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");

    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/vnd.github+json",
    };

    const [repoRes, contributorsRes, commitsRes, releasesRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${OWNER}/${REPO}`, { headers }),
      fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contributors?per_page=10`, { headers }),
      fetch(`https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=1`, { headers }),
      fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=5`, { headers }),
    ]);

    const repo = await repoRes.json();
    const contributors = contributorsRes.ok ? await contributorsRes.json() : [];
    const releases = releasesRes.ok ? await releasesRes.json() : [];

    // Parse total commit count from Link header
    let totalCommits = null;
    const linkHeader = commitsRes.headers.get("Link");
    if (linkHeader) {
      const match = linkHeader.match(/page=(\d+)>; rel="last"/);
      if (match) totalCommits = parseInt(match[1]);
    }

    return Response.json({
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      language: repo.language,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      defaultBranch: repo.default_branch,
      totalCommits,
      contributors: Array.isArray(contributors) ? contributors.map(c => ({
        login: c.login,
        avatar: c.avatar_url,
        contributions: c.contributions,
        url: c.html_url,
      })) : [],
      releases: releases.map(r => ({
        name: r.name || r.tag_name,
        tag: r.tag_name,
        publishedAt: r.published_at,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});