import type { Sprint } from '.';

/**
 * @fileOverview Data Provider Interface.
 * This file defines the abstract interface that all data providers must implement.
 * This allows the application to be agnostic about the underlying data source.
 */

export interface DataProvider {
  getSprints(): Promise<Sprint[]>;
  getSprintWithReport(sprintId: string): Promise<{ sprint: Sprint | null, reportContent: string | null }>;
  addSprint(sprintData: Omit<Sprint, 'id' | 'lastUpdatedAt'>): Promise<Sprint>;
  updateSprint(sprintId: string, sprintData: Partial<Omit<Sprint, 'id'>>): Promise<Sprint>;
  deleteSprint(sprintId: string): Promise<void>;
  saveReport(sprintId: string, reportContent: string): Promise<{ updatedSprint: Sprint, reportContent: string }>;
}
