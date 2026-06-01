import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");

    const body = await req.json();
    const { owner, repo } = body;

    if (!owner || !repo) {
      return Response.json({ error: "owner and repo are required" }, { status: 400 });
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const [repoRes, commitsRes, releasesRes, contributorsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=5`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=5`, { headers }),
    ]);

    const [repoData, commitsData, releasesData, contributorsData] = await Promise.all([
      repoRes.json(),
      commitsRes.json(),
      releasesRes.json(),
      contributorsRes.json(),
    ]);

    // Get total commit count from Link header
    const linkHeader = commitsRes.headers.get("Link") || "";
    const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
    const totalCommits = lastPageMatch ? parseInt(lastPageMatch[1]) : commitsData.length;

    return Response.json({
      repo: {
        name: repoData.name,
        full_name: repoData.full_name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        open_issues: repoData.open_issues_count,
        watchers: repoData.watchers_count,
        language: repoData.language,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
        html_url: repoData.html_url,
        default_branch: repoData.default_branch,
        visibility: repoData.visibility,
      },
      totalCommits,
      releases: Array.isArray(releasesData) ? releasesData.map(r => ({
        name: r.name || r.tag_name,
        tag: r.tag_name,
        published_at: r.published_at,
        url: r.html_url,
      })) : [],
      contributors: Array.isArray(contributorsData) ? contributorsData.map(c => ({
        login: c.login,
        avatar_url: c.avatar_url,
        contributions: c.contributions,
        html_url: c.html_url,
      })) : [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});