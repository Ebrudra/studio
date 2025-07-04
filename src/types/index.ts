export type Team = 'Backend' | 'iOS' | 'Web' | 'Android' | 'Mobile' | 'Out of Scope';
export type TicketType = 'User story' | 'Bug' | 'Task' | 'Buffer';
export type TicketTypeScope = 'Build' | 'Run' | 'Sprint';
export type TicketStatus = 'To Do' | 'In Progress' | 'Done' | 'Blocked';

export interface DailyLog {
  date: string; // YYYY-MM-DD
  loggedHours: number;
}

export interface Ticket {
  id: string;
  title: string;
  scope: Team;
  type: TicketType;
  typeScope: TicketTypeScope;
  estimation: number;
  timeLogged: number;
  status: TicketStatus;
  completionDate?: string;
  dailyLogs?: DailyLog[];
  isOutOfScope?: boolean;
}

export interface DailySprintData {
  day: number;
  date: string;
  ideal: number;
  actual: number;
  completed: number;
  dailyCompletedByTeam: Record<Team, number>;
  dailyBuildByTeam: Record<Team, number>;
  dailyRunByTeam: Record<Team, number>;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  tickets: Ticket[];
  burnDownData: DailySprintData[];
  lastUpdatedAt: string;
  teamCapacity?: Record<Team, number>;
  totalCapacity?: number;
  buildCapacity?: number;
  runCapacity?: number;
}
