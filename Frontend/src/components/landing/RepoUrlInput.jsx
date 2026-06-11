import { motion } from 'framer-motion';
import { useGitHubUrl } from '../../hooks/useGitHubUrl';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { shakeVariants } from '../../styles/animations';
import { UrlValidationError } from './UrlValidationError';
import { useEffect } from 'react';

export function RepoUrlInput({ onSubmit, urlFromChip }) {
  const { url, error, isShaking, handleChange, validate, setUrlFromChip } = useGitHubUrl();

  useEffect(() => {
    if (urlFromChip && urlFromChip !== url) {
      setUrlFromChip(urlFromChip);
      setTimeout(() => onSubmit(urlFromChip), 10);
    }
  }, [urlFromChip, setUrlFromChip, onSubmit, url]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = validate();
    if (parsed) {
      onSubmit(url);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col">
      <motion.form 
        variants={shakeVariants}
        animate={isShaking ? 'shake' : 'rest'}
        onSubmit={handleSubmit}
        className="flex w-full shadow-neo border-2 border-neo-black bg-white"
        style={{ borderRadius: 0 }}
      >
        <div className="flex-1 relative text-black">
          <input 
            value={url}
            onChange={handleChange}
            placeholder="https://github.com/owner/repo"
            className={`w-full h-14 px-4 text-lg font-mono focus:outline-none placeholder-[#0A0A0A]/50 ${error ? 'text-neo-pink' : 'text-neo-black'}`}
            style={{ borderRadius: 0, border: 'none' }}
          />
        </div>
        <button 
          type="submit" 
          className="h-14 px-8 text-lg font-bold uppercase shrink-0 border-l-2 border-neo-black bg-neo-yellow hover:bg-neo-yellow/90 text-[#0A0A0A] transition-colors"
          style={{ borderRadius: 0 }}
        >
          ANALYZE &rarr;
        </button>
      </motion.form>
      <UrlValidationError message={error} />
    </div>
  );
}
