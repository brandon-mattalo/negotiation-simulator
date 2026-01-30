import jwt from 'jsonwebtoken';
import { User } from '../shared/types/negotiation';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-this';
const JWT_EXPIRATION = '24h';

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

export const generateToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
