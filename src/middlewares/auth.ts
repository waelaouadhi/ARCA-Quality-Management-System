import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/shared/utils/jwt';
import { AuthenticationError } from '@/shared/errors';

type AuthenticatedRequest = Request & {
  user?: ReturnType<typeof verifyToken>;
};

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
