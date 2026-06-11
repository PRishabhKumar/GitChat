export function Input({ error, className = '', ...props }) {
  const borderClass = error ? 'border-neo-pink' : 'border-neo-black';
  return (
    <input
      {...props}
      style={{ borderRadius: 0 }}
      className={`bg-white border-2 ${borderClass} font-mono text-[14px] px-3 py-2 w-full focus:shadow-neo-blue focus:border-neo-blue focus:outline-none ${className}`}
    />
  );
}
