import { hashPassword, comparePassword } from '@/shared/utils/password';
import { generateToken } from '@/shared/utils/jwt';
import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '@/shared/errors';
import { JWTPayload } from '@/shared/utils/jwt';
import { AuthRepository } from './auth.repository';
import { RegisterInputSchema, LoginInputSchema } from './auth.validation';
import { z } from 'zod';

export class AuthService {
  constructor(private readonly authRepository = new AuthRepository()) {}

  async register(email: string, password: string, firstName: string, lastName: string) {
    // Validate input
    try {
      RegisterInputSchema.parse({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const existingUser = await this.authRepository.findUserByEmail(email);

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await hashPassword(password);

    const user = await this.authRepository.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async login(email: string, password: string) {
    // Validate input
    try {
      LoginInputSchema.parse({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async getCurrentUser(currentUser?: JWTPayload) {
    if (!currentUser) {
      throw new AuthenticationError('Not authenticated');
    }

    const user = await this.authRepository.findUserById(currentUser.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}
