import { PrismaClient } from '@prisma/client';
import { Assignment, AssignmentStudent, AssignmentStatus, AssignmentType, Message } from '../types/negotiation';

const prisma = new PrismaClient();

export class AssignmentService {
  async createAssignment(data: {
    instructorId: string;
    configurationId: string;
    studentIds: string[];
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

    if (!data.studentIds || data.studentIds.length === 0) {
      throw new Error('At least one student must be assigned');
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

    // Verify every student is enrolled under this instructor
    for (const studentId of data.studentIds) {
      const authorized = await this.verifyStudentEnrollment(studentId, data.instructorId);
      if (!authorized) {
        throw new Error('One or more students are not enrolled under you');
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        instructorId: data.instructorId,
        configurationId: data.configurationId,
        name: data.name,
        description: data.description,
        assignmentType: data.assignmentType,
        theme: data.theme,
        availableFrom: data.availableFrom,
        availableUntil: data.availableUntil,
        deadline: data.deadline,
        students: {
          create: data.studentIds.map(studentId => ({ studentId })),
        },
      },
    });

    return this.getAssignment(assignment.id) as Promise<Assignment>;
  }

  async verifyStudentEnrollment(studentId: string, instructorId: string): Promise<boolean> {
    const enrollment = await prisma.enrollment.findUnique({ where: { studentId } });
    return !!enrollment && enrollment.instructorId === instructorId;
  }

  private async getLatestSession(assignmentId: string, studentId: string) {
    return prisma.session.findFirst({
      where: { assignmentId, studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private mapSessionSummary(session: any) {
    return {
      id: session.id,
      studentId: session.studentId,
      configurationId: session.configurationId,
      assignmentId: session.assignmentId ?? undefined,
      messages: JSON.parse(session.messages as string) as Message[],
      startTime: session.startTime,
      endTime: session.endTime ?? undefined,
      timeRemaining: session.timeRemaining ?? undefined,
      isActive: session.isActive,
      outcome: session.outcome ? JSON.parse(session.outcome as string) : undefined,
    };
  }

  // Student-facing: this assignment flattened to just the one student's own
  // status/session, matching the shape the app used before assignments could
  // have multiple students.
  async getAssignmentsForStudent(studentId: string): Promise<Assignment[]> {
    const memberships = await prisma.assignmentStudent.findMany({
      where: {
        studentId,
        assignment: { isActive: true },
      },
      include: {
        assignment: { include: { configuration: true } },
      },
      orderBy: {
        assignment: { deadline: 'asc' },
      },
    });

    return Promise.all(
      memberships.map(async membership => {
        const mapped = this.mapAssignment(membership.assignment);
        mapped.status = await this.getAssignmentStatus(membership.assignment, studentId);
        const session = await this.getLatestSession(membership.assignment.id, studentId);
        if (session) {
          mapped.session = this.mapSessionSummary(session);
        }
        return mapped;
      })
    );
  }

  // Instructor-facing: every assignment they own, each with the full list of
  // assigned students and each student's own status/session.
  async getAssignmentsForInstructor(instructorId: string): Promise<Assignment[]> {
    const assignments = await prisma.assignment.findMany({
      where: { instructorId },
      include: {
        configuration: true,
        students: { include: { student: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(assignments.map(assignment => this.attachStudents(assignment)));
  }

  async getAssignment(assignmentId: string): Promise<Assignment | null> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        configuration: true,
        students: { include: { student: true } },
      },
    });

    if (!assignment) {
      return null;
    }

    return this.attachStudents(assignment);
  }

  private async attachStudents(assignment: any): Promise<Assignment> {
    const mapped = this.mapAssignment(assignment);
    mapped.students = await Promise.all(
      assignment.students.map(async (membership: any): Promise<AssignmentStudent> => {
        const status = await this.getAssignmentStatus(assignment, membership.studentId);
        const session = await this.getLatestSession(assignment.id, membership.studentId);
        return {
          id: membership.student.id,
          username: membership.student.username,
          status,
          session: session ? this.mapSessionSummary(session) : undefined,
        };
      })
    );
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
      configurationId: string;
      assignmentType: AssignmentType;
      studentIds: string[];
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

    if (updates.configurationId) {
      const config = await prisma.configuration.findUnique({
        where: { id: updates.configurationId },
      });
      if (!config) {
        throw new Error('Configuration not found');
      }
      if (config.instructorId !== instructorId) {
        throw new Error('Configuration does not belong to this instructor');
      }
    }

    const { studentIds, ...scalarUpdates } = updates;

    if (studentIds) {
      if (studentIds.length === 0) {
        throw new Error('At least one student must be assigned');
      }
      for (const studentId of studentIds) {
        const authorized = await this.verifyStudentEnrollment(studentId, instructorId);
        if (!authorized) {
          throw new Error('One or more students are not enrolled under you');
        }
      }
    }

    await prisma.$transaction(async tx => {
      if (Object.keys(scalarUpdates).length > 0) {
        await tx.assignment.update({ where: { id: assignmentId }, data: scalarUpdates });
      }

      if (studentIds) {
        const current = await tx.assignmentStudent.findMany({
          where: { assignmentId },
          select: { studentId: true },
        });
        const currentIds = new Set(current.map(c => c.studentId));
        const nextIds = new Set(studentIds);

        const toAdd = studentIds.filter(id => !currentIds.has(id));
        const toRemove = [...currentIds].filter(id => !nextIds.has(id));

        if (toAdd.length > 0) {
          await tx.assignmentStudent.createMany({
            data: toAdd.map(studentId => ({ assignmentId, studentId })),
          });
        }
        if (toRemove.length > 0) {
          await tx.assignmentStudent.deleteMany({
            where: { assignmentId, studentId: { in: toRemove } },
          });
        }
      }
    });

    return this.getAssignment(assignmentId) as Promise<Assignment>;
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
        botOpeningOffer: typeof assignment.configuration.botOpeningOffer === 'string' ? JSON.parse(assignment.configuration.botOpeningOffer) : (assignment.configuration.botOpeningOffer || []),
        rubric: typeof assignment.configuration.rubric === 'string' ? JSON.parse(assignment.configuration.rubric) : (assignment.configuration.rubric || []),
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
