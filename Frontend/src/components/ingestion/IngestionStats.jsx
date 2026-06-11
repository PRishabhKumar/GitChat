import { formatNumber } from '../../utils/formatters';

export function IngestionStats({ progress }) {
  if (!progress) return null;
  const { processedFiles, totalFiles, estimatedSecondsRemaining } = progress;
  
  return (
    <div className="flex justify-between items-center w-full mt-2 font-mono text-xs text-neo-gray uppercase font-bold">
      <div>
        Files: {formatNumber(processedFiles)} / {formatNumber(totalFiles)}
      </div>
      <div>
        {estimatedSecondsRemaining > 0 ? `~${estimatedSecondsRemaining}s remaining` : 'Completing...'}
      </div>
    </div>
  );
}
