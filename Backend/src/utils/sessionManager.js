import { logger } from './logger.js';

const sessions = new Map();

// function to create a new session

export function createSession(sessionId, repoInfo) {
  sessions.set(sessionId, {
    sessionId,
    repoInfo,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  });
  logger.info(`[Session] Created: ${sessionId} for ${repoInfo.fullName}`);
}

// function that triggers when you use a particular session and updates its last activity timestamp

export function touchSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivityAt = Date.now();
    return true;
  }
  return false;
}

// function to get information about a particular session

export function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

// function to delete a specific session

export function deleteSession(sessionId) {
  const existed = sessions.has(sessionId);
  sessions.delete(sessionId);
  if (existed) logger.info(`[Session] Deleted: ${sessionId}`);
  return existed;
}

// function to get all the sessions IDs at once

export function getAllSessionIds() {
  return Array.from(sessions.keys());
}

// This is a cleanup timer. It runs automatically after every 5 min and checks for the expired sessions and removes them
function startCleanupTimer() {
  setInterval(async () => {
    const ttlMs = parseInt(process.env.SESSION_TTL_MINUTES || '30') * 60 * 1000;
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
      if (now - session.lastActivityAt > ttlMs) {
        sessions.delete(id);
        // Async cleanup of vector data — import lazily to avoid circular deps
        try {
          const { VectorStoreService } = await import('../services/vectorStoreService.js');
          await VectorStoreService.deleteSession(id);
        } catch (err) {
          logger.warn(`[Session] Failed to cleanup vectors for ${id}:`, err.message);
        }
        logger.info(`[Session] Expired and cleaned: ${id}`);
      }
    }
  }, 5 * 60 * 1000);
}

startCleanupTimer();