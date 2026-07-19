export type UserRole = 'instructor' | 'student';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: Date;
}

export type BotStrategy = 'collaborative' | 'competitive' | 'analytical' | 'emotional';
export type Temperament = number; // 1-10
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export interface BotPersonality {
  formality: 'casual' | 'professional' | 'formal';
  emotionalResponsiveness: 'low' | 'medium' | 'high';
  communicationStyle: 'direct' | 'indirect' | 'diplomatic';
}

// A rubric is a table with a fixed set of columns: the component name plus
// three performance levels (Level 1 = low, Level 3 = high). Each row describes
// one component and what each level looks like for it.
export interface RubricRow {
  component: string;
  levels: string[]; // exactly 3 entries: Level 1, Level 2, Level 3
}

export type Rubric = RubricRow[];

export interface NegotiationConfiguration {
  id: string;
  instructorId: string;
  name: string;
  scenario: string;
  studentGoals: string[];
  botGoals: string[];
  studentConstraints: string[];
  botConstraints: string[];
  rubric: Rubric;
  botStrategy: BotStrategy;
  temperament: Temperament;
  difficulty: DifficultyLevel;
  timeLimit: number; // minutes, 0 = unlimited
  personality: BotPersonality;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageRole = 'student' | 'bot' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  // Future voice support
  audioUrl?: string;
  transcriptMetadata?: {
    confidence: number;
    language: string;
  };
}

export interface NegotiationSession {
  id: string;
  studentId: string;
  configurationId: string;
  assignmentId?: string;
  messages: Message[];
  startTime: Date;
  endTime?: Date;
  timeRemaining?: number; // seconds
  isActive: boolean;
  outcome?: SessionOutcome;
}

export type OutcomeType = 'success' | 'partial' | 'failure' | 'timeout';

export interface RubricEvaluation {
  component: string;
  levels: string[]; // snapshot of the 3 level descriptions
  levelAchieved: number; // 1-3
  explanation: string;
}

export interface SessionOutcome {
  type: OutcomeType;
  feedback: string;
  botAnalysis: string;
  rubricEvaluation: RubricEvaluation[];
  overallLevel: number; // 1-3, the mode of the component levels
  overallAssessment: string;
  // Legacy trophy-based fields, retained (optional) for sessions evaluated
  // before the rubric feature.
  criteriaEvaluation?: CriteriaEvaluation[];
  overallTrophy?: TrophyLevel;
  trophiesEarned?: {
    bronze: number;
    silver: number;
    gold: number;
  };
}

export type TrophyLevel = 'bronze' | 'silver' | 'gold';
export type AchievementLevel = 'fail' | 'close' | 'achieve' | 'exceed';

export interface CriteriaEvaluation {
  goal: string; // The student goal being evaluated
  achievementLevel: AchievementLevel; // fail/close/achieve/exceed
  trophyLevel?: TrophyLevel; // bronze (close), silver (achieve), gold (exceed), undefined (fail)
  achieved: boolean; // true if close or better (has a trophy)
  notes: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  configuration: Omit<NegotiationConfiguration, 'id' | 'instructorId' | 'createdAt' | 'updatedAt'>;
  isDefault: boolean;
}

export type AssignmentType = 'practice' | 'exam';
export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

export interface Assignment {
  id: string;
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
  configuration?: NegotiationConfiguration;
  status?: AssignmentStatus;
  session?: NegotiationSession;
}
