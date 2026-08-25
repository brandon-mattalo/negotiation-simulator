import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { User, UserRole } from '../types/negotiation';
import { generateToken } from '../utils/jwt.util';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Thrown only for an actual wrong username/password, so callers can tell a
// rejected login apart from an unexpected failure (DB down, bad config, etc.)
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export class AccountDeactivatedError extends Error {
  constructor() {
    super('This account has been deactivated. Contact your administrator.');
    this.name = 'AccountDeactivatedError';
  }
}

export class AuthService {
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Verify password
    const isValid = await this.comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new AccountDeactivatedError();
    }

    // Generate token
    const userObj: User = {
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
    };

    const token = generateToken(userObj);

    return { token, user: userObj };
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export const authService = new AuthService();
