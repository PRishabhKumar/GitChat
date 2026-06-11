import { parseGitHubUrl } from './urlParser';

export function validateGitHubUrl(input) {
  if (!input || !input.trim()) {
    return { valid: false, message: 'URL cannot be empty.' };
  }
  const parsed = parseGitHubUrl(input);
  if (!parsed) {
    return { valid: false, message: 'Invalid GitHub repository URL.' };
  }
  return { valid: true, parsed };
}

export function validateMessage(text) {
  if (!text || !text.trim()) {
    return { valid: false, message: 'Message cannot be empty.' };
  }
  if (text.length > 2000) {
    return { valid: false, message: 'Message exceeds 2000 characters limit.' };
  }
  return { valid: true };
}
