export function parseGitHubUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  let trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  } else if (trimmed.startsWith('http://')) {
    trimmed = trimmed.replace('http://', 'https://');
  }

  if (trimmed.endsWith('.git')) {
    trimmed = trimmed.slice(0, -4);
  }

  try {
    const parsedUrl = new URL(trimmed);
    if (parsedUrl.hostname !== 'github.com' && parsedUrl.hostname !== 'www.github.com') {
      return null;
    }

    const parts = parsedUrl.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1];
    let branch = null;

    if (parts.length >= 4 && parts[2] === 'tree') {
      branch = parts.slice(3).join('/');
    }

    const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
    if (!ownerRegex.test(owner)) return null;

    const repoRegex = /^[a-zA-Z0-9-._]{1,100}$/;
    if (!repoRegex.test(repo)) return null;

    return { owner, repo, branch };
  } catch (e) {
    return null;
  }
}
