export function LanguagePill({ language }) {
  const lower = (language || '').toLowerCase();
  let bgClass = 'bg-neo-black text-neo-cream';

  if (lower === 'javascript' || lower === 'js') bgClass = 'bg-neo-yellow text-neo-black';
  else if (lower === 'typescript' || lower === 'ts') bgClass = 'bg-neo-blue text-white';
  else if (lower === 'python' || lower === 'py') bgClass = 'bg-neo-green text-neo-black';
  else if (lower === 'rust' || lower === 'rs') bgClass = 'bg-neo-orange text-white';
  else if (lower === 'ruby' || lower === 'rb') bgClass = 'bg-neo-pink text-white';

  return (
    <span className={`px-2 py-1 text-xs font-bold uppercase border-2 border-neo-black ${bgClass}`} style={{ borderRadius: '2px' }}>
      {language}
    </span>
  );
}
