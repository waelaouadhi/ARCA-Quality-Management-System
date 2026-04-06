jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { generateToken, verifyToken } from '@/shared/utils/jwt';
import { hashPassword, comparePassword } from '@/shared/utils/password';
import { AppError } from '@/shared/errors';

describe('jwt utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generateToken delegates to jsonwebtoken.sign', () => {
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');

    const token = generateToken({ userId: 'u1', email: 'a@b.com', role: 'ADMIN' });

    expect(token).toBe('signed-token');
    expect(jwt.sign).toHaveBeenCalled();
  });

  it('verifyToken returns decoded payload', () => {
    const payload = { userId: 'u1', email: 'a@b.com', role: 'ADMIN' };
    (jwt.verify as jest.Mock).mockReturnValue(payload);

    expect(verifyToken('token')).toEqual(payload);
  });

  it('verifyToken throws AuthenticationError when token invalid', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('bad token');
    });

    expect(() => verifyToken('bad')).toThrow(AppError);
    try {
      verifyToken('bad');
    } catch (error) {
      expect((error as AppError).statusCode).toBe(401);
    }
  });
});

describe('password utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hashPassword delegates to bcrypt.hash', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    await expect(hashPassword('secret')).resolves.toBe('hashed');
    expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
  });

  it('comparePassword delegates to bcrypt.compare', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(comparePassword('secret', 'hashed')).resolves.toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith('secret', 'hashed');
  });
});
