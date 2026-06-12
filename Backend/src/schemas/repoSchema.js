import {z} from 'zod'

export const IngestionRequestSchema = z.object({
    repoUlr : z.string().min(1, 'Repo URL is needed').max(500),
    sessionId: z.string().uuid("Session ID must be a valid UUID v4 ID")
})

export const SessionIdParamSchema = z.object({
    sessionId: z.string().uuid("Session ID must be a valid UUID v4")
})