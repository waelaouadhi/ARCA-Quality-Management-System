import { hashPassword, comparePassword } from '@/shared/utils/password';
import { generateToken } from '@/shared/utils/jwt';
import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '@/shared/errors';
import { JWTPayload } from '@/shared/utils/jwt';
import { RegisterSchema, LoginSchema } from '@/shared/validation/schemas';
import { auditService } from '@/modules/audit/audit.service';
import { AuthRepository } from './auth.repository';

export class AuthService {
  constructor(private readonly authRepository = new AuthRepository()) {}

  async register(email: string, password: string, firstName: string, lastName: string) {
    const validation = RegisterSchema.safeParse({ email, password, firstName, lastName });
    if (!validation.success) {
      throw new ValidationError(validation.error.errors.map((e) => e.message).join('; '));
    }

    const existingUser = await this.authRepository.findUserByEmail(validation.data.email);

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await hashPassword(validation.data.password);

    const user = await this.authRepository.createUser({
      email: validation.data.email,
      password: hashedPassword,
      firstName: validation.data.firstName,
      lastName: validation.data.lastName,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await auditService.log({ userId: user.id, action: 'REGISTER', entity: 'User', entityId: user.id });

    return { user, token };
  }

  async login(email: string, password: string) {
    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      throw new ValidationError(validation.error.errors.map((e) => e.message).join('; '));
    }

    const user = await this.authRepository.findUserByEmail(validation.data.email);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await comparePassword(validation.data.password, user.password);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await auditService.log({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id });

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
