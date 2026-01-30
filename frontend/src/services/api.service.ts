import {
  User,
  UserRole,
  NegotiationConfiguration,
  NegotiationSession,
  Message,
  SessionOutcome,
  Template,
  Assignment,
  AssignmentType,
} from '../types/negotiation';

class ApiService {
  private baseUrl = import.meta.env.VITE_API_URL || '/api';
  private token: string | null = null;

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  loadToken(): void {
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(username: string, password: string, role: UserRole): Promise<User> {
    const data = await this.request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    });
    return data.user;
  }

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const data = await this.request<{ user: User }>('/auth/me');
    return data.user;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  // Configurations
  async getConfigurations(): Promise<NegotiationConfiguration[]> {
    const data = await this.request<{ configurations: NegotiationConfiguration[] }>('/configurations');
    return data.configurations;
  }

  async getConfiguration(id: string): Promise<NegotiationConfiguration> {
    const data = await this.request<{ configuration: NegotiationConfiguration }>(`/configurations/${id}`);
    return data.configuration;
  }

  async createConfiguration(config: Partial<NegotiationConfiguration>): Promise<NegotiationConfiguration> {
    const data = await this.request<{ configuration: NegotiationConfiguration }>('/configurations', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    return data.configuration;
  }

  async updateConfiguration(id: string, config: Partial<NegotiationConfiguration>): Promise<NegotiationConfiguration> {
    const data = await this.request<{ configuration: NegotiationConfiguration }>(`/configurations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    return data.configuration;
  }

  async deleteConfiguration(id: string): Promise<void> {
    await this.request(`/configurations/${id}`, { method: 'DELETE' });
  }

  async activateConfiguration(id: string): Promise<NegotiationConfiguration> {
    const data = await this.request<{ configuration: NegotiationConfiguration }>(`/configurations/${id}/activate`, {
      method: 'POST',
    });
    return data.configuration;
  }

  // Sessions
  async startSession(configId: string, assignmentId?: string): Promise<NegotiationSession> {
    const data = await this.request<{ session: NegotiationSession }>('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ configurationId: configId, assignmentId }),
    });
    return data.session;
  }

  async sendMessage(sessionId: string, message: string): Promise<{ message: Message; botResponse: Message }> {
    return this.request(`/sessions/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async endSession(sessionId: string): Promise<SessionOutcome> {
    const data = await this.request<{ outcome: SessionOutcome }>(`/sessions/${sessionId}/end`, {
      method: 'POST',
    });
    return data.outcome;
  }

  async getSessionHistory(): Promise<NegotiationSession[]> {
    const data = await this.request<{ sessions: NegotiationSession[] }>('/sessions');
    return data.sessions;
  }

  async getSession(id: string): Promise<NegotiationSession> {
    const data = await this.request<{ session: NegotiationSession }>(`/sessions/${id}`);
    return data.session;
  }

  async getActiveSession(): Promise<NegotiationSession | null> {
    try {
      const data = await this.request<{ session: NegotiationSession }>('/sessions/active');
      return data.session;
    } catch (error) {
      return null;
    }
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    const data = await this.request<{ templates: Template[] }>('/templates');
    return data.templates;
  }

  async getTemplate(id: string): Promise<Template> {
    const data = await this.request<{ template: Template }>(`/templates/${id}`);
    return data.template;
  }

  async useTemplate(templateId: string): Promise<NegotiationConfiguration> {
    const data = await this.request<{ configuration: NegotiationConfiguration }>(`/templates/${templateId}/use`, {
      method: 'POST',
    });
    return data.configuration;
  }

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
    const data = await this.request<{ assignments: Assignment[] }>('/assignments');
    return data.assignments;
  }

  async getAssignment(id: string): Promise<Assignment> {
    const data = await this.request<{ assignment: Assignment }>(`/assignments/${id}`);
    return data.assignment;
  }

  async createAssignment(assignment: {
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
    const data = await this.request<{ assignment: Assignment }>('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
    return data.assignment;
  }

  async createBulkAssignments(
    configId: string,
    studentIds: string[],
    assignmentData: {
      name: string;
      description: string;
      assignmentType: AssignmentType;
      theme?: string;
      availableFrom: Date;
      availableUntil: Date;
      deadline: Date;
    }
  ): Promise<Assignment[]> {
    const data = await this.request<{ assignments: Assignment[] }>('/assignments/bulk', {
      method: 'POST',
      body: JSON.stringify({ configurationId: configId, studentIds, ...assignmentData }),
    });
    return data.assignments;
  }

  async updateAssignment(id: string, assignment: Partial<Assignment>): Promise<Assignment> {
    const data = await this.request<{ assignment: Assignment }>(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assignment),
    });
    return data.assignment;
  }

  async deleteAssignment(id: string): Promise<void> {
    await this.request(`/assignments/${id}`, { method: 'DELETE' });
  }

  async getAssignmentsByStudent(studentId: string): Promise<Assignment[]> {
    const data = await this.request<{ assignments: Assignment[] }>(`/assignments/student/${studentId}`);
    return data.assignments;
  }

  // Instructor
  async getStudentSessions(filters?: {
    studentId?: string;
    configId?: string;
    dateFrom?: Date;
  }): Promise<NegotiationSession[]> {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.configId) params.append('configId', filters.configId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await this.request<{ sessions: NegotiationSession[] }>(`/instructor/sessions${query}`);
    return data.sessions;
  }

  async getStudents(): Promise<User[]> {
    const data = await this.request<{ students: User[] }>('/instructor/students');
    return data.students;
  }

  async getConfiguration(id: string): Promise<NegotiationConfiguration> {
    const data = await this.request<{ configuration: NegotiationConfiguration }>(`/configurations/${id}`);
    return data.configuration;
  }
}

export const apiService = new ApiService();
