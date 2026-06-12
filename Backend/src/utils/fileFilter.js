// All text-based source file extensions to include
const INCLUDE_EXTENSIONS = new Set([
  // Source code
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.pyw',
  '.java', '.go', '.rs', '.cpp', '.cxx', '.cc', '.c', '.h', '.hpp',
  '.cs', '.rb', '.php', '.swift', '.kt', '.kts', '.scala', '.r', '.R',
  '.m', '.mm', '.lua', '.dart', '.ex', '.exs', '.erl', '.hs', '.clj',
  '.cljs', '.ml', '.mli', '.jl', '.nim', '.zig', '.v', '.vhd', '.pl', '.pm',
  // Scripts & automation
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.psm1', '.bat', '.cmd',
  // Documentation & markup
  '.md', '.mdx', '.rst', '.txt', '.adoc', '.asciidoc', '.tex', '.wiki',
  // Config
  '.json', '.jsonc', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
  '.xml', '.properties', '.gradle', '.cmake', '.bazel', '.bzl',
  // Web
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.svg', '.vue', '.svelte',
  // Data (size-gated separately at 100KB in fileFilter function)
  '.csv', '.tsv',
]);

// Special filenames (no extension) to include
const INCLUDE_FILENAMES = new Set([
  'Makefile', 'Dockerfile', 'Jenkinsfile', 'Gemfile', 'Rakefile',
  'Procfile', 'Brewfile', 'CMakeLists.txt', '.editorconfig',
  '.eslintrc', '.prettierrc', '.babelrc', '.nvmrc', 'BUILD',
]);

// Files to explicitly exclude regardless of extension
const EXCLUDE_FILENAMES = new Set([
  'package-lock.json', 'yarn.lock', 'poetry.lock', 'Pipfile.lock',
  'Cargo.lock', 'composer.lock', 'pnpm-lock.yaml', 'bun.lockb',
]);

// Patterns to exclude (checked against full path)
const EXCLUDE_PATTERNS = [
  /\.min\.js$/,
  /\.min\.css$/,
  /\.map$/,
  /\.snap$/,      // Jest snapshots
  /\.d\.ts$/,     // TypeScript declaration files
];

/**
 * Determine whether a file from the GitHub tree should be processed.
 * @param {string} filePath - Relative file path in the repo (e.g., "src/utils/auth.js")
 * @param {number} fileSizeBytes - File size in bytes
 * @returns {{ include: boolean, reason?: string }}
 */
export function shouldIncludeFile(filePath, fileSizeBytes) {
  const fileName = filePath.split('/').pop();
  const ext = getExtension(filePath);

  // Explicit exclude by filename
  if (EXCLUDE_FILENAMES.has(fileName)) {
    return { include: false, reason: 'lock file or generated file' };
  }

  // Explicit exclude by pattern
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(filePath)) {
      return { include: false, reason: 'excluded pattern (minified, map, or declaration file)' };
    }
  }

  // Exclude files that are too large (> 1MB)
  const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_KB || '1000') * 1024;
  if (fileSizeBytes > MAX_FILE_SIZE) {
    return { include: false, reason: `file exceeds ${MAX_FILE_SIZE / 1024}KB size limit` };
  }

  // Check if special filename (no extension match needed)
  if (INCLUDE_FILENAMES.has(fileName)) {
    return { include: true };
  }

  // Check extension
  if (!ext) {
    // No extension — will need binary detection after fetching content
    return { include: true, needsBinaryCheck: true };
  }

  // Data files: cap at 100KB
  if (['.csv', '.tsv'].includes(ext)) {
    if (fileSizeBytes > 100 * 1024) {
      return { include: false, reason: 'data file exceeds 100KB limit' };
    }
    return { include: true };
  }

  if (!INCLUDE_EXTENSIONS.has(ext)) {
    return { include: false, reason: 'unsupported extension' };
  }

  return { include: true };
}

/**
 * Detect if a string content is binary by checking for null bytes in first 512 chars.
 */
export function isBinaryContent(content) {
  const sample = content.slice(0, 512);
  return sample.includes('\0');
}

/**
 * Get lowercase file extension including the dot, or empty string.
 */
function getExtension(filePath) {
  const lastDot = filePath.lastIndexOf('.');
  const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  if (lastDot > lastSlash && lastDot < filePath.length - 1) {
    return filePath.slice(lastDot).toLowerCase();
  }
  return '';
}

/**
 * Detect primary programming language from a list of file extensions.
 * Returns sorted array of detected language names.
 */
export function detectLanguages(filePaths) {
  const extToLang = {
    '.js': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript', '.jsx': 'JavaScript',
    '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.py': 'Python', '.pyw': 'Python',
    '.java': 'Java',
    '.go': 'Go',
    '.rs': 'Rust',
    '.cpp': 'C++', '.cxx': 'C++', '.cc': 'C++', '.h': 'C/C++ Header',
    '.c': 'C',
    '.cs': 'C#',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.kt': 'Kotlin', '.kts': 'Kotlin',
    '.scala': 'Scala',
    '.r': 'R', '.R': 'R',
    '.lua': 'Lua',
    '.dart': 'Dart',
    '.ex': 'Elixir', '.exs': 'Elixir',
    '.hs': 'Haskell',
    '.md': 'Markdown', '.mdx': 'Markdown',
    '.html': 'HTML', '.htm': 'HTML',
    '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
    '.yaml': 'YAML', '.yml': 'YAML',
    '.toml': 'TOML',
    '.json': 'JSON',
    '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell',
    '.sql': 'SQL',
  };

  const counts = {};
  for (const path of filePaths) {
    const ext = getExtension(path);
    const lang = extToLang[ext];
    if (lang) counts[lang] = (counts[lang] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
}

/**
 * Map file extension to language name for chunk metadata.
 */
export function extensionToLanguage(ext) {
  const map = {
    '.js': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript', '.jsx': 'JavaScript',
    '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.py': 'Python', '.pyw': 'Python',
    '.java': 'Java', '.go': 'Go', '.rs': 'Rust',
    '.cpp': 'C++', '.cxx': 'C++', '.cc': 'C++', '.c': 'C',
    '.h': 'C/C++ Header', '.hpp': 'C/C++ Header',
    '.cs': 'C#', '.rb': 'Ruby', '.php': 'PHP', '.swift': 'Swift',
    '.kt': 'Kotlin', '.kts': 'Kotlin', '.scala': 'Scala',
    '.r': 'R', '.R': 'R', '.lua': 'Lua', '.dart': 'Dart',
    '.ex': 'Elixir', '.exs': 'Elixir', '.hs': 'Haskell',
    '.md': 'Markdown', '.mdx': 'Markdown', '.rst': 'reStructuredText',
    '.html': 'HTML', '.htm': 'HTML',
    '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass', '.less': 'Less',
    '.vue': 'Vue', '.svelte': 'Svelte',
    '.yaml': 'YAML', '.yml': 'YAML',
    '.toml': 'TOML', '.json': 'JSON', '.jsonc': 'JSON',
    '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell', '.fish': 'Shell',
    '.sql': 'SQL', '.xml': 'XML', '.svg': 'SVG',
    '.txt': 'Text', '.csv': 'CSV', '.tsv': 'TSV',
  };
  return map[ext?.toLowerCase()] || 'Unknown';
}