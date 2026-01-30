import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { User, UserRole } from '../types/negotiation';
import { generateToken } from '../utils/jwt.util';
import { validateUsername, validatePassword } from '../utils/validation.util';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export class AuthService {
  async register(username: string, password: string, role: UserRole): Promise<User> {
    // Validate input
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      throw new Error(usernameValidation.error);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
    });

    return {
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
      createdAt: user.createdAt,
    };
  }

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await this.comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const userObj: User = {
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
      createdAt: user.createdAt,
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
