import { PrismaClient } from '@prisma/client';
import { Assignment, AssignmentStatus, AssignmentType } from '../../../shared/types/negotiation';

const prisma = new PrismaClient();

export class AssignmentService {
  async createAssignment(data: {
    instructorId: string;
    configurationId: string;
    studentId: string;
    name: string;
    description: string;
    assignmentType: AssignmentType;
    theme?: string;
    availableFrom: Date;
    availableUntil: Date;
    deadline: Date;
  }): Promise<Assignment> {
    // Validate dates
    if (data.availableFrom >= data.availableUntil) {
      throw new Error('Available from date must be before available until date');
    }
    if (data.availableUntil > data.deadline) {
      throw new Error('Available until date must be before or equal to deadline');
    }

    // Verify configuration exists and belongs to instructor
    const config = await prisma.configuration.findUnique({
      where: { id: data.configurationId },
    });

    if (!config) {
      throw new Error('Configuration not found');
    }

    if (config.instructorId !== data.instructorId) {
      throw new Error('Configuration does not belong to this instructor');
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: data.studentId },
    });

    if (!student || student.role !== 'student') {
      throw new Error('Student not found');
    }

    const assignment = await prisma.assignment.create({
      data: {
        instructorId: data.instructorId,
        configurationId: data.configurationId,
        studentId: data.studentId,
        name: data.name,
        description: data.description,
        assignmentType: data.assignmentType,
        theme: data.theme,
        availableFrom: data.availableFrom,
        availableUntil: data.availableUntil,
        deadline: data.deadline,
      },
      include: {
        configuration: true,
      },
    });

    return this.mapAssignment(assignment);
  }

  async createBulkAssignments(
    instructorId: string,
    configurationId: string,
    studentIds: string[],
    data: {
      name: string;
      description: string;
      assignmentType: AssignmentType;
      theme?: string;
      availableFrom: Date;
      availableUntil: Date;
      deadline: Date;
    }
  ): Promise<Assignment[]> {
    // Validate configuration
    const config = await prisma.configuration.findUnique({
      where: { id: configurationId },
    });

    if (!config) {
      throw new Error('Configuration not found');
    }

    if (config.instructorId !== instructorId) {
      throw new Error('Configuration does not belong to this instructor');
    }

    // Validate all students exist
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'student',
      },
    });

    if (students.length !== studentIds.length) {
      throw new Error('One or more student IDs are invalid');
    }

    // Create assignments for each student
    const assignments = await Promise.all(
      studentIds.map(studentId =>
        this.createAssignment({
          instructorId,
          configurationId,
          studentId,
          ...data,
        })
      )
    );

    return assignments;
  }

  async getAssignmentsForStudent(studentId: string): Promise<Assignment[]> {
    const assignments = await prisma.assignment.findMany({
      where: {
        studentId,
        isActive: true,
      },
      include: {
        configuration: true,
        sessions: {
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        deadline: 'asc',
      },
    });

    return Promise.all(
      assignments.map(async assignment => {
        const mapped = this.mapAssignment(assignment);
        mapped.status = await this.getAssignmentStatus(assignment, studentId);
        if (assignment.sessions && assignment.sessions.length > 0) {
          const session = assignment.sessions[0];
          mapped.session = {
            id: session.id,
            studentId: session.studentId,
            configurationId: session.configurationId,
            assignmentId: session.assignmentId ?? undefined,
            messages: JSON.parse(session.messages as string),
            startTime: session.startTime,
            endTime: session.endTime ?? undefined,
            timeRemaining: session.timeRemaining ?? undefined,
            isActive: session.isActive,
            outcome: session.outcome ? JSON.parse(session.outcome as string) : undefined,
          };
        }
        return mapped;
      })
    );
  }

  async getAssignmentsForInstructor(instructorId: string): Promise<Assignment[]> {
    const assignments = await prisma.assignment.findMany({
      where: {
        instructorId,
      },
      include: {
        configuration: true,
        student: true,
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Promise.all(
      assignments.map(async assignment => {
        const mapped = this.mapAssignment(assignment);
        mapped.status = await this.getAssignmentStatus(assignment, assignment.studentId);
        if (assignment.sessions && assignment.sessions.length > 0) {
          const session = assignment.sessions[0];
          mapped.session = {
            id: session.id,
            studentId: session.studentId,
            configurationId: session.configurationId,
            assignmentId: session.assignmentId ?? undefined,
            messages: JSON.parse(session.messages as string),
            startTime: session.startTime,
            endTime: session.endTime ?? undefined,
            timeRemaining: session.timeRemaining ?? undefined,
            isActive: session.isActive,
            outcome: session.outcome ? JSON.parse(session.outcome as string) : undefined,
          };
        }
        return mapped;
      })
    );
  }

  async getAssignment(assignmentId: string): Promise<Assignment | null> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        configuration: true,
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!assignment) {
      return null;
    }

    const mapped = this.mapAssignment(assignment);
    mapped.status = await this.getAssignmentStatus(assignment, assignment.studentId);
    return mapped;
  }

  async updateAssignment(
    assignmentId: string,
    instructorId: string,
    updates: Partial<{
      name: string;
      description: string;
      theme: string;
      availableFrom: Date;
      availableUntil: Date;
      deadline: Date;
      isActive: boolean;
    }>
  ): Promise<Assignment> {
    // Verify assignment exists and belongs to instructor
    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing) {
      throw new Error('Assignment not found');
    }

    if (existing.instructorId !== instructorId) {
      throw new Error('Unauthorized');
    }

    const assignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: updates,
      include: {
        configuration: true,
      },
    });

    return this.mapAssignment(assignment);
  }

  async deleteAssignment(assignmentId: string, instructorId: string): Promise<void> {
    // Verify assignment exists and belongs to instructor
    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing) {
      throw new Error('Assignment not found');
    }

    if (existing.instructorId !== instructorId) {
      throw new Error('Unauthorized');
    }

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });
  }

  private async getAssignmentStatus(assignment: any, studentId: string): Promise<AssignmentStatus> {
    const now = new Date();

    // Check if there's a completed session for this assignment
    const completedSession = await prisma.session.findFirst({
      where: {
        assignmentId: assignment.id,
        studentId,
        isActive: false,
        endTime: { not: null },
      },
    });

    if (completedSession) {
      return 'completed';
    }

    // Check if there's an active session
    const activeSession = await prisma.session.findFirst({
      where: {
        assignmentId: assignment.id,
        studentId,
        isActive: true,
      },
    });

    if (activeSession) {
      return 'in_progress';
    }

    // Check if overdue
    if (now > assignment.deadline) {
      return 'overdue';
    }

    return 'not_started';
  }

  private mapAssignment(assignment: any): Assignment {
    const mapped: Assignment = {
      id: assignment.id,
      instructorId: assignment.instructorId,
      configurationId: assignment.configurationId,
      studentId: assignment.studentId,
      name: assignment.name,
      description: assignment.description,
      assignmentType: assignment.assignmentType,
      theme: assignment.theme,
      availableFrom: assignment.availableFrom,
      availableUntil: assignment.availableUntil,
      deadline: assignment.deadline,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };

    if (assignment.configuration) {
      mapped.configuration = {
        id: assignment.configuration.id,
        instructorId: assignment.configuration.instructorId,
        name: assignment.configuration.name,
        scenario: assignment.configuration.scenario,
        studentGoals: JSON.parse(assignment.configuration.studentGoals as string),
        botGoals: JSON.parse(assignment.configuration.botGoals as string),
        studentConstraints: JSON.parse(assignment.configuration.studentConstraints as string),
        botConstraints: JSON.parse(assignment.configuration.botConstraints as string),
        botStrategy: assignment.configuration.botStrategy,
        temperament: assignment.configuration.temperament,
        difficulty: assignment.configuration.difficulty,
        timeLimit: assignment.configuration.timeLimit,
        personality: JSON.parse(assignment.configuration.personality as string),
        isActive: assignment.configuration.isActive,
        createdAt: assignment.configuration.createdAt,
        updatedAt: assignment.configuration.updatedAt,
      };
    }

    return mapped;
  }
}

export const assignmentService = new AssignmentService();
