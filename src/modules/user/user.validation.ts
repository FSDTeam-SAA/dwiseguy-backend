import { z } from 'zod';

/* ===============================
   Avatar Schema
================================ */
const avatarSchema = z.object({
      public_id: z.string().optional(),
      url: z.string().url().optional(),
      duration: z.number().nullable().optional(),
      file_type: z.string().optional(),
});

/* ===============================
   Register / Create User
================================ */
export const createUserSchema = z.object({
      body: z.object({
            name: z.string().min(2, 'Name is too short'),
            email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email address'),
            password: z
                  .string()
                  .min(6, 'Password must be at least 6 characters')
                  .regex(
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
                        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
                  ),
            username: z
                  .string()
                  .min(3)
                  .regex(/^[a-z0-9_]+$/, 'Username must be lowercase and alphanumeric')
                  .optional(),

            phone: z.string().optional(),

            role: z.enum(['user', 'admin']).optional(),

            avatar: avatarSchema.optional(),
      }),
});



export const updateUserSchema = z.object({
      body: z.object({
            name: z.string().min(2).optional(),
            username: z
                  .string()
                  .min(3)
                  .regex(/^[a-z0-9_]+$/)
                  .optional(),
            phone: z.string().optional(),
            avatar: avatarSchema.optional(),
      }),
});


// /login user validation schema
export const loginUserSchema = z.object({
      body: z.object({
            email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email pattern'),
            password: z
                  .string()
                  .min(6, 'Password must be at least 6 characters')
                  .regex(
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
                        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
                  ),
      }),
})


