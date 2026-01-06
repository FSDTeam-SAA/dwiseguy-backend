export const USER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
  GUEST: 'guest',
} as const;

// Optional: Type for TypeScript safety
export type TUserRole = keyof typeof USER_ROLE;