export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.25, ease: 'easeIn' } },
};

export const buttonVariants = {
  rest:  { x: 0, y: 0, boxShadow: '4px 4px 0px #0A0A0A' },
  hover: { x: 2, y: 2, boxShadow: '2px 2px 0px #0A0A0A', transition: { duration: 0.08 } },
  tap:   { x: 4, y: 4, boxShadow: '0px 0px 0px #0A0A0A', transition: { duration: 0.05 } },
};

export const buttonGhostVariants = {
  rest:  { x: 0, y: 0, boxShadow: '2px 2px 0px #0A0A0A' },
  hover: { x: 1, y: 1, boxShadow: '1px 1px 0px #0A0A0A', transition: { duration: 0.08 } },
  tap:   { x: 2, y: 2, boxShadow: '0px 0px 0px #0A0A0A', transition: { duration: 0.05 } },
};

export const shakeVariants = {
  shake: { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.45, ease: 'easeInOut' } },
};

export const userMessageVariants = {
  initial: { opacity: 0, x: 30, scale: 0.94 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

export const assistantMessageVariants = {
  initial: { opacity: 0, x: -30, scale: 0.94 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } },
};

export const accordionVariants = {
  open:   { height: 'auto', opacity: 1, transition: { height: { duration: 0.25, ease: 'easeOut' }, opacity: { duration: 0.2 } } },
  closed: { height: 0, opacity: 0, transition: { height: { duration: 0.2, ease: 'easeIn' }, opacity: { duration: 0.15 } } },
};

export const stampVariants = {
  initial: { scale: 0, rotate: -8, opacity: 0 },
  animate: { scale: [0, 1.15, 0.95, 1.05, 1], rotate: [-8, 3, -2, 1, 0], opacity: 1, transition: { type: 'spring', duration: 0.6, bounce: 0.5 } },
};

export const scrollButtonVariants = {
  hidden:  { scale: 0, opacity: 0, transition: { duration: 0.15 } },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } },
};

export const toastVariants = {
  initial: { opacity: 0, x: 60, y: -10 },
  animate: { opacity: 1, x: 0, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit:    { opacity: 0, x: 60, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const modalBackdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 0.5, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

export const modalBoxVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 350, damping: 28 } },
  exit:    { scale: 0.9, opacity: 0, transition: { duration: 0.15 } },
};

export const sidebarVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 280, damping: 28 } },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const letterVariants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};
