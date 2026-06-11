import { useState } from 'react';
import { validateGitHubUrl } from '../utils/validators';

export function useGitHubUrl() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);
  const [isShaking, setIsShaking] = useState(false);

  const handleChange = (e) => {
    setUrl(e.target.value);
    if (error) setError(null);
  };

  const setUrlFromChip = (newUrl) => {
    setUrl(newUrl);
    setError(null);
  };

  const validate = () => {
    const result = validateGitHubUrl(url);
    if (!result.valid) {
      setError(result.message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return null;
    }
    return result.parsed;
  };

  return { url, error, isShaking, handleChange, validate, setUrlFromChip };
}
