// THIS FILE CONTAINS ALL THE CUSTOM ERROR CLASSES THAT ALL THE SERVICES THROW AND THEY WILL BE CAUGHT BY THE GLOBAL ERROR HANDLER

export class AppError extends Error{
    constructor(message, statusCode=500, code='Internal_Server_Error'){
        super(message)
        this.name = this.construcor.name
        this.statusCode = statusCode
        this.code = code
        this.isOperational = true;
    }
}

export class RepoNotFoundError extends AppError{
    constructor(){
        super("The given Repo was not found. Please ensure that it exists and it is public", 404, 'RPEO_NOT_FOUND') // in the order of (message, statsuCode, code)
    }
}

export class RepoPrivateError extends AppError{
    constructor(){
        super("Please enter the URL of a public repo.", 403, "REPO_PRIVATE")
    }
}

export class RepoEmptyError extends AppError{
    constructor(){
        super("The given repo does not have any files to process", 422, "REPO_EMPTY")
    }
}

export class RateLimitError extends AppError{
    constructor(message, retryAfter){
        super(message);
        this.retryAfter = retryAfter;
    }
}

export class SessionNotFound extends AppError{
    constructor(){
        super("Session not found. Maybe the session has expired. Please start a new session", 404, "SESSION_NOT_FOUND")
    }
}

export class EmbeddingError extends AppError{
    constructor(message="Could not generate embeddings"){
        super(message, 500, "EMBEDDING_ERROR")
    }
}

export class ValidationError extends AppError{
    constructor(message){
        super(message, 400, "VALIDATION_ERROR")
    }
}