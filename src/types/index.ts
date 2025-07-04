export type Team = 'Backend' | 'iOS' | 'Web' | 'Android' | 'Mobile';
export type TicketType = 'User story' | 'Bug' | 'Task' | 'Buffer';
export type TicketTypeScope = 'Build' | 'Run' | 'Sprint';
export type TicketStatus = 'To Do' | 'In Progress' | 'Done' | 'Blocked';

export interface Ticket {
  id: string;
  title: string;
  scope: Team;
  type: TicketType;
  typeScope: TicketTypeScope;
  estimation: number;
  timeLogged: number;
  status: TicketStatus;
}

export interface DailySprintData {
  day: number;
  date: string;
  ideal: number;
  actual: number;
  completed: number;
  dailyCompletedByTeam: Record<Team, number>;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  tickets: Ticket[];
  burnDownData: DailySprintData[];
  lastUpdatedAt: string;
}
