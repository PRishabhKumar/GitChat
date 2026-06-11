import { useState } from 'react';
import { AnimatedLogo } from './AnimatedLogo';
import { RepoUrlInput } from './RepoUrlInput';
import { ExampleChips } from './ExampleChips';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

export function LandingPage() {
  const [selectedChipUrl, setSelectedChipUrl] = useState(null);
  const { setRepoUrl, setAppPhase } = useAppContext();

  const handleAnalyze = (url) => {
    setRepoUrl(url);
    setAppPhase('ingesting');
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-neo-cream overflow-hidden">
      <div className="landing-grid-bg absolute inset-0 z-0"></div>
      
      <div className="w-full max-w-4xl px-4 flex flex-col items-center text-center z-10 relative mt-[-10vh]">
        <AnimatedLogo />
        
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-6 mb-12 text-xl md:text-2xl font-body text-neo-gray font-medium max-w-2xl mx-auto"
        >
          Have natural language conversations with any public GitHub repository using AI-powered code intelligence.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full"
        >
          <RepoUrlInput onSubmit={handleAnalyze} urlFromChip={selectedChipUrl} />
          
          <div className="mt-16">
            <p className="font-mono text-sm uppercase text-neo-gray font-bold tracking-widest">Or try an example</p>
            <ExampleChips onSelect={(url) => setSelectedChipUrl(url)} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
