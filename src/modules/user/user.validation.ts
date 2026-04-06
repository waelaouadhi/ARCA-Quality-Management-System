import { z } from 'zod';

/**
 * User validation schemas using Zod
 */

export const UpdateUserInputSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),
  
  email: z
    .string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must not exceed 100 characters')
    .optional(),
  
  role: z.enum(['ADMIN', 'MANAGER', 'USER', 'VIEWER']).optional(),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const UserIdSchema = z.string().uuid('Invalid user ID format');

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
