import {ValidationError} from "../errors.js"

// this middleware validates the request body against a fixed and predefined Zod schema

export function validateReqBody(schema){
    return (req, res, next)=>{
        const result = schema.safeParse(req.body);
        if(!result.success){
            const message = result.error.errors.map(e=>`${e.path.join('.')}:${e.message}`).join('; ');
            return next(new ValidationError(message))
        }
        req.body = result.data; // we replace the recieved req body with the trimmed values
        next();
    };
}


// this middleware validates the req.params against a predefined Zod schema

export function validateParams(schema){
    return (req, res, next)=>{
        const result = schema.safeParse(req.params)
        if(!result.success){
            const message = result.error.errors.map(e=>`${e.path.join('.')}:${e.message}`).join('; ')
            return next(new ValidationError(message))
        }
        // replace with the trimmed values again
        req.params = result.data;
        next();
    }
}