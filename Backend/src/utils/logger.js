// src/utils/logger.js
const pad = (n) => String(n).padStart(2, '0');

function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const logger = {
  info:  (...args) => console.log(`\x1b[36m[${timestamp()}] INFO\x1b[0m`, ...args),
  warn:  (...args) => console.warn(`\x1b[33m[${timestamp()}] WARN\x1b[0m`, ...args),
  error: (...args) => console.error(`\x1b[31m[${timestamp()}] ERROR\x1b[0m`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\x1b[90m[${timestamp()}] DEBUG\x1b[0m`, ...args);
    }
  }
};