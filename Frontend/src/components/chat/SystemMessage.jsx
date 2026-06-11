export function SystemMessage({ message }) {
  return (
    <div className="flex w-full justify-center my-4">
      <div className="bg-neo-cream border border-neo-black px-4 py-2 text-xs font-mono font-bold uppercase text-neo-gray shadow-neo-sm">
        {message.content}
      </div>
    </div>
  );
}
