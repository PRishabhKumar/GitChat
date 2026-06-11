export function RelevanceBadge({ score }) {
  const percentage = Math.round(score * 100);
  let bgClass = 'bg-neo-orange text-white';
  if (percentage >= 80) bgClass = 'bg-neo-green text-neo-black';
  else if (percentage >= 60) bgClass = 'bg-neo-yellow text-neo-black';

  return (
    <span className={`px-2 py-0.5 text-xs font-bold border border-neo-black ${bgClass}`} style={{ borderRadius: 0 }}>
      {percentage}%
    </span>
  );
}
