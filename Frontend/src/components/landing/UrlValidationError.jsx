export function UrlValidationError({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="bg-neo-pink border-2 border-neo-black text-white px-4 py-2 mt-4 text-center shadow-neo-sm font-bold" style={{ borderRadius: 0 }}>
      {message}
    </div>
  );
}
