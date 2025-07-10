
export type Team = 'Backend' | 'iOS' | 'Web' | 'Android';
export type TicketType = 'User story' | 'Bug' | 'Task' | 'Buffer';
export type TicketTypeScope = 'Build' | 'Run' | 'Sprint';
export type TicketStatus = 'To Do' | 'Doing' | 'Done' | 'Blocked';

export interface DailyLog {
  date: string; // YYYY-MM-DD
  loggedHours: number;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  platform: Team;
  type: TicketType;
  typeScope: TicketTypeScope;
  estimation: number;
  timeLogged: number;
  status: TicketStatus;
  creationDate?: string; // YYYY-MM-DD
  completionDate?: string; // YYYY-MM-DD
  dailyLogs?: DailyLog[];
  isOutOfScope?: boolean;
  isInitialScope?: boolean;
  assignee?: string;
  tags?: string[];
}

export interface SprintDay {
    day: number;
    date: string; // YYYY-MM-DD
}

export interface TeamCapacity {
  plannedBuild: number;
  plannedRun: number;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Scoping' | 'Active' | 'Completed';
  tickets: Ticket[];
  sprintDays: SprintDay[];
  lastUpdatedAt: string;
  teamCapacity: Record<Team, TeamCapacity>;
  teamPersonDays?: Record<Team, number>;
  totalCapacity?: number;
  buildCapacity?: number;
  runCapacity?: number;
  reportFilePaths?: string[];
  isSyncedToFirebase?: boolean;
}
