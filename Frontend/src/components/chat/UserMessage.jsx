import { motion } from 'framer-motion';
import { userMessageVariants } from '../../styles/animations';

export function UserMessage({ message }) {
  return (
    <motion.div 
      variants={userMessageVariants}
      initial="initial"
      animate="animate"
      className="flex self-end max-w-[80%] mt-4 flex-col items-end"
    >
      <span className="font-mono text-xs text-neo-gray uppercase font-bold mb-1 mr-1">YOU</span>
      <div className="bg-neo-yellow border-2 border-neo-black shadow-neo-sm p-4 relative" style={{ borderRadius: 0 }}>
        <p className="font-body text-base font-medium whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}
