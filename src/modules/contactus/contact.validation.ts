import { z } from "zod"

export const contactValidationSchema = z.object({
    body: z.object({
        fullName: z.string().min(1, 'Full name is required'),
        email: z.string().email('Invalid email'),
        subject: z.string().min(1, 'Subject is required'),
        message: z.string().min(1, 'Message is required'),
    }),
})

export type ContactValidationSchema = z.infer<typeof contactValidationSchema>
