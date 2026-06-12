export function parseGitHubUrl(input) {
  if (!input || typeof input !== 'string') return null;

  let url = input.trim();

  // Prepend protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Coerce http to https
  url = url.replace(/^http:\/\//, 'https://');

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  // Host must be github.com or www.github.com
  if (!['github.com', 'www.github.com'].includes(parsed.hostname)) {
    return null;
  }

  // Strip trailing slashes and .git suffix from pathname
  const path = parsed.pathname.replace(/\.git$/, '').replace(/\/$/, '');

  // Split: ['', 'owner', 'repo', 'tree'|'blob', 'branchOrRef', ...rest]
  const parts = path.split('/').filter(Boolean);

  if (parts.length < 2) return null;

  const owner = parts[0];
  const repo = parts[1];
  let branch = null;

  // Extract branch from /tree/{branch} or /blob/{branch}/...
  if (parts.length >= 4 && (parts[2] === 'tree' || parts[2] === 'blob')) {
    branch = parts[3];
  }

  // Validate owner: alphanumeric + hyphens, 1-39 chars, can't start/end with hyphen
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(owner) &&
      !/^[a-zA-Z0-9]$/.test(owner)) {
    return null;
  }

  // Validate repo: alphanumeric + hyphens + dots + underscores, 1-100 chars
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(repo)) {
    return null;
  }

  return { owner, repo, branch };
}