import { z } from 'zod';

export const emailSchema = z.string().email('Please enter a valid email');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  username:    z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, underscores'),
  email:       emailSchema,
  password:    passwordSchema,
});

export const workSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type:  z.enum(['poetry', 'screenplay', 'playlet', 'long_work', 'short_story', 'artwork']),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type WorkInput   = z.infer<typeof workSchema>;
