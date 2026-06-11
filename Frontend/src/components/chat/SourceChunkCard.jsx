import { RelevanceBadge } from '../shared/RelevanceBadge';
import { truncatePath } from '../../utils/formatters';

export function SourceChunkCard({ chunk }) {
  const { path, score, lines } = chunk;
  
  return (
    <div className="bg-white border-2 border-neo-black p-3 shadow-neo-sm shrink-0 w-64 hover:bg-gray-50 transition-colors cursor-default" style={{ borderRadius: 0 }}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-xs font-bold truncate text-neo-black max-w-[150px]" title={path}>
          {truncatePath(path)}
        </span>
        <RelevanceBadge score={score} />
      </div>
      <div className="font-mono text-[10px] text-neo-gray bg-neo-cream p-1 border border-neo-black truncate">
        {lines ? lines.replace(/\s+/g, ' ') : 'No preview'}
      </div>
    </div>
  );
}
