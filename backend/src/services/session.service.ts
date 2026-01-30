import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  NegotiationSession,
  Message,
  SessionOutcome,
  UserRole,
} from '../types/negotiation';
import { claudeService } from './claude.service';
import { validateMessage } from '../utils/validation.util';

const prisma = new PrismaClient();

export class SessionService {
  async startSession(
    studentId: string,
    configId: string,
    assignmentId?: string
  ): Promise<NegotiationSession> {
    // Get configuration
    const config = await prisma.configuration.findUnique({
      where: { id: configId },
    });

    if (!config) {
      throw new Error('Configuration not found');
    }

    // If assignmentId provided, verify it exists and belongs to this student
    if (assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (assignment.studentId !== studentId) {
        throw new Error('Assignment does not belong to this student');
      }

      if (assignment.configurationId !== configId) {
        throw new Error('Assignment configuration mismatch');
      }

      // Check if assignment is available
      const now = new Date();
      if (now < assignment.availableFrom) {
        throw new Error('Assignment not yet available');
      }
      if (now > assignment.availableUntil) {
        throw new Error('Assignment is no longer available');
      }
    }

    // Check if student has an active session
    const activeSession = await prisma.session.findFirst({
      where: {
        studentId,
        isActive: true,
      },
    });

    if (activeSession) {
      throw new Error('You already have an active session. Please complete or end it first.');
    }

    // Create initial system message
    const initialMessage: Message = {
      id: uuidv4(),
      role: 'system',
      content: `Negotiation started. Scenario: ${config.scenario}`,
      timestamp: new Date(),
    };

    // Calculate time remaining (convert minutes to seconds)
    const timeRemaining = config.timeLimit > 0 ? config.timeLimit * 60 : null;

    // Create session
    const session = await prisma.session.create({
      data: {
        studentId,
        configurationId: configId,
        assignmentId: assignmentId || null,
        messages: JSON.stringify([initialMessage]),
        timeRemaining,
        isActive: true,
      },
      include: {
        configuration: true,
      },
    });

    // Generate bot's opening message
    const botMessage: Message = {
      id: uuidv4(),
      role: 'bot',
      content: await claudeService.generateBotResponse(
        this.mapConfiguration(session.configuration),
        [initialMessage],
        'Begin the negotiation with an opening statement.'
      ),
      timestamp: new Date(),
    };

    // Update session with bot's opening
    const messages = [initialMessage, botMessage];
    await prisma.session.update({
      where: { id: session.id },
      data: {
        messages: JSON.stringify(messages),
      },
    });

    return this.mapSession(session, messages);
  }

  async sendMessage(
    sessionId: string,
    message: string,
    studentId: string
  ): Promise<{ message: Message; botResponse: Message }> {
    // Validate message
    const validation = validateMessage(message);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { configuration: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    if (!session.isActive) {
      throw new Error('Session is not active');
    }

    // Parse existing messages
    const messages: Message[] = JSON.parse(session.messages as string);

    // Create user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'student',
      content: message,
      timestamp: new Date(),
    };

    messages.push(userMessage);

    // Generate bot response
    const botResponseContent = await claudeService.generateBotResponse(
      this.mapConfiguration(session.configuration),
      messages,
      message
    );

    const botMessage: Message = {
      id: uuidv4(),
      role: 'bot',
      content: botResponseContent,
      timestamp: new Date(),
    };

    messages.push(botMessage);

    // Update time remaining if applicable
    let timeRemaining = session.timeRemaining;
    if (timeRemaining !== null && session.startTime) {
      const elapsed = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
      timeRemaining = Math.max(0, (session.configuration.timeLimit * 60) - elapsed);

      // Auto-end if time expired
      if (timeRemaining === 0) {
        await this.endSession(sessionId, studentId, true);
      }
    }

    // Save updated messages
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        messages: JSON.stringify(messages),
        timeRemaining,
      },
    });

    return { message: userMessage, botResponse: botMessage };
  }

  async endSession(
    sessionId: string,
    studentId: string,
    timeout: boolean = false
  ): Promise<SessionOutcome> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { configuration: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    if (!session.isActive) {
      throw new Error('Session is already ended');
    }

    const messages: Message[] = JSON.parse(session.messages as string);
    const sessionData: NegotiationSession = this.mapSession(session, messages);

    // Evaluate the session
    let outcome = await claudeService.evaluateNegotiation(
      this.mapConfiguration(session.configuration),
      sessionData
    );

    // Override outcome type if timeout
    if (timeout) {
      outcome = {
        ...outcome,
        type: 'timeout',
      };
    }

    // Update session
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        endTime: new Date(),
        outcome: JSON.stringify(outcome),
      },
    });

    return outcome;
  }

  async getSessionHistory(userId: string, role: UserRole): Promise<NegotiationSession[]> {
    const where = role === 'student' ? { studentId: userId } : {};

    const sessions = await prisma.session.findMany({
      where,
      include: {
        configuration: true,
        student: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions.map(session => {
      const messages: Message[] = JSON.parse(session.messages as string);
      return this.mapSession(session, messages);
    });
  }

  async getSession(sessionId: string): Promise<NegotiationSession | null> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        configuration: true,
      },
    });

    if (!session) {
      return null;
    }

    // Calculate current time remaining if session is still active
    let timeRemaining = session.timeRemaining;
    if (session.isActive && timeRemaining !== null && session.startTime && session.configuration.timeLimit > 0) {
      const elapsed = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
      timeRemaining = Math.max(0, (session.configuration.timeLimit * 60) - elapsed);
    }

    const messages: Message[] = JSON.parse(session.messages as string);
    const mappedSession = this.mapSession(session, messages);

    // Override with calculated timeRemaining if active
    if (session.isActive) {
      return {
        ...mappedSession,
        timeRemaining: timeRemaining ?? undefined,
      };
    }

    return mappedSession;
  }

  async getActiveSession(studentId: string): Promise<NegotiationSession | null> {
    const session = await prisma.session.findFirst({
      where: {
        studentId,
        isActive: true,
      },
      include: {
        configuration: true,
      },
    });

    if (!session) {
      return null;
    }

    // Calculate current time remaining
    let timeRemaining = session.timeRemaining;
    if (timeRemaining !== null && session.startTime && session.configuration.timeLimit > 0) {
      const elapsed = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
      timeRemaining = Math.max(0, (session.configuration.timeLimit * 60) - elapsed);
    }

    const messages: Message[] = JSON.parse(session.messages as string);
    const mappedSession = this.mapSession(session, messages);

    // Override with calculated timeRemaining
    return {
      ...mappedSession,
      timeRemaining: timeRemaining ?? undefined,
    };
  }

  async cancelSession(sessionId: string, studentId: string): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    if (!session.isActive) {
      throw new Error('Session is already ended');
    }

    // Mark session as inactive without evaluation
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        endTime: new Date(),
      },
    });
  }

  private mapSession(session: any, messages: Message[]): NegotiationSession {
    return {
      id: session.id,
      studentId: session.studentId,
      configurationId: session.configurationId,
      assignmentId: session.assignmentId,
      messages,
      startTime: session.startTime,
      endTime: session.endTime,
      timeRemaining: session.timeRemaining,
      isActive: session.isActive,
      outcome: session.outcome ? JSON.parse(session.outcome as string) : undefined,
    };
  }

  private mapConfiguration(config: any): any {
    return {
      id: config.id,
      instructorId: config.instructorId,
      name: config.name,
      scenario: config.scenario,
      studentGoals: JSON.parse(config.studentGoals as string),
      botGoals: JSON.parse(config.botGoals as string),
      studentConstraints: JSON.parse(config.studentConstraints as string),
      botConstraints: JSON.parse(config.botConstraints as string),
      botStrategy: config.botStrategy,
      temperament: config.temperament,
      difficulty: config.difficulty,
      timeLimit: config.timeLimit,
      personality: JSON.parse(config.personality as string),
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}

export const sessionService = new SessionService();
