import { JWTPayload } from '../utils/jwt';

export interface AuthContext {
  user?: JWTPayload;
}
