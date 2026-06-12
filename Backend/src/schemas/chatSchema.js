import {z} from 'zod'

const chatHistorySchema = z.object({
    role: z.enum(['User', 'Agent']),
    content: z.string().max(4000) // the message cannot be more than 4000 characters long
})

export const MessageRequestSchema = z.object({
    sessionId: z.string().uuid('Session ID must be a valid UUID v4 ID'),
    message: z.string().min(1, "Message cannot be empty").max(2000).trim(),
    history: z.array(chatHistorySchema).max(12).default([]) // the history is by default set to an empty array
})