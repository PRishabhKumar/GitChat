import rateLimit from 'express-rate-limit'

export const globalRateLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 200,
    legacyHeaders: false,
    standardHeaders: true,
    message: {error: "Too many requests. Please slow down and try again after some time", code: "RATE_LIMIT_EXCEEDED"}
});

// this rate limiter is used for how many repos can be ingested and hence prevents the ingestion API endpoint's abuse

export const ingestionRateLimiter = rateLimit({
    windowMs: 60*60*1000,
    max: 15,
    message: {error: "Too many repositories to be ingested. Please try again after some time", code: "INGESTION_RATE_LIMITED_EXCEEDED"}
});

export const chatRateLimiter = rateLimit({
    windowMs: 60*1000,
    max: 40,
    message: {error: "You are sending a lot of messages very frequently. Please slow down and try again later after some time", code: "CHAT RATE LIMIT EXCEEDED"}
});