"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.loginUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
/* ===============================
   Avatar Schema
================================ */
const avatarSchema = zod_1.z.object({
    public_id: zod_1.z.string().optional(),
    url: zod_1.z.string().url().optional(),
    duration: zod_1.z.number().nullable().optional(),
    file_type: zod_1.z.string().optional(),
});
/* ===============================
   Register / Create User
================================ */
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name is too short'),
        email: zod_1.z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email address'),
        password: zod_1.z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
        username: zod_1.z
            .string()
            .min(3)
            .regex(/^[a-z0-9_]+$/, 'Username must be lowercase and alphanumeric')
            .optional(),
        phone: zod_1.z.string().optional(),
        role: zod_1.z.enum(['user', 'admin']).optional(),
        avatar: avatarSchema.optional(),
    }),
});
//login user validation schema
exports.loginUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email pattern'),
        password: zod_1.z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    }),
});
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        username: zod_1.z
            .string()
            .min(3)
            .regex(/^[a-z0-9_]+$/)
            .optional(),
        phone: zod_1.z.string().optional(),
        avatar: avatarSchema.optional(),
    }),
});
