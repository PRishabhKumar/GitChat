import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, buttonGhostVariants } from '../../styles/animations';
import { EXAMPLE_REPOS } from '../../constants/exampleRepos';

const combinedVariants = {
  initial: staggerItem.initial,
  animate: staggerItem.animate,
  hover: buttonGhostVariants.hover,
  tap: buttonGhostVariants.tap,
  rest: buttonGhostVariants.rest
};

export function ExampleChips({ onSelect }) {
  return (
    <motion.div 
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-wrap justify-center gap-4 mt-8"
    >
      {EXAMPLE_REPOS.map((repo) => (
        <motion.button
          key={repo.label}
          variants={combinedVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          onClick={() => onSelect(repo.url)}
          className="border-2 border-neo-black px-4 py-2 font-mono text-sm uppercase bg-transparent text-neo-black hover:bg-gray-100 hover:text-[#0A0A0A] transition-colors shadow-neo-sm"
          style={{ borderRadius: 0 }}
        >
          {repo.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
