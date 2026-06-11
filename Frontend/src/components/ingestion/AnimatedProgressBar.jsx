export function AnimatedProgressBar({ percentage, isComplete }) {
  return (
    <div 
      className="w-full h-6 border-2 border-neo-black bg-neo-cream shadow-neo-sm overflow-hidden" 
      style={{ borderRadius: 0 }}
      role="progressbar" 
      aria-valuenow={percentage}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div 
        className={`h-full border-r-2 border-neo-black transition-all duration-300 ${isComplete ? 'bg-neo-green' : 'progress-bar-fill'}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
