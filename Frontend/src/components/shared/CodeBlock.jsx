import React, { Suspense } from 'react';
import { useClipboard } from '../../hooks/useClipboard';
import { Copy, Check } from 'lucide-react';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Prism = React.lazy(() => import('react-syntax-highlighter').then(module => ({ default: module.Prism })));

export function CodeBlock({ language, code }) {
  const { copied, copy } = useClipboard();

  return (
    <div className="flex flex-col w-full shadow-neo-sm shadow-neo-gray" style={{ borderRadius: 0 }}>
      <div className="bg-neo-black border-b-2 border-neo-gray flex justify-between items-center px-4 py-2" style={{ borderRadius: 0 }}>
        <span className="text-neo-green font-mono uppercase text-xs font-bold">{language || 'text'}</span>
        <button 
          onClick={() => copy(code)}
          className="text-neo-gray hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={16} className="text-neo-green" /> : <Copy size={16} />}
        </button>
      </div>
      <div className="bg-neo-black" style={{ borderRadius: 0 }}>
        <Suspense fallback={<div className="p-4 text-neo-gray font-mono text-sm">Loading code...</div>}>
          <Prism
            language={language}
            style={oneDark}
            customStyle={{ margin: 0, padding: '16px', background: 'transparent', fontSize: '13px', borderRadius: 0 }}
          >
            {code}
          </Prism>
        </Suspense>
      </div>
    </div>
  );
}
