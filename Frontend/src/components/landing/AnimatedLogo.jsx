import { motion } from 'framer-motion';
import { staggerContainer, letterVariants } from '../../styles/animations';

export function AnimatedLogo() {
  const text = "GitChat";
  
  return (
    <motion.div 
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="font-display font-bold text-[52px] md:text-[80px] flex items-center justify-center leading-none tracking-tight"
    >
      <motion.svg 
        variants={letterVariants}
        xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
        className="mr-2 md:mr-4 w-10 h-10 md:w-16 md:h-16 text-neo-black"
      >
        <polyline points="4 17 10 11 4 5"></polyline>
        <line x1="12" y1="19" x2="20" y2="19"></line>
      </motion.svg>
      {text.split('').map((char, index) => {
        let className = "text-neo-black";
        if (index >= 3) {
          className = "text-neo-blue"; // "Chat" part
        }
        return (
          <motion.span key={index} variants={letterVariants} className={className}>
            {char}
          </motion.span>
        );
      })}
    </motion.div>
  );
}
