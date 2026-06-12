import {logger} from "../utils/logger.js"

export function errorHandler(error, req, res, next){
    const statusCode = error.statusCode || 500 // fallback to 500 in any other case
    const response = {
        error: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_SERVER_ERROR"
    };
    if(error.retryAfter) response.retryAfter = error.retryAfter; // specify the time after which the user can retry (in case of rate limiting related errors)
    if(!error.isOperational){
        logger.error('[Unhandled error', error);
    }
    res.status(statusCode).json(response)
}

