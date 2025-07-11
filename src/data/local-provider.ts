/**
 * @fileOverview Local file system data provider.
 * This class implements the DataProvider interface for reading and writing sprint data
 * to the local file system in the `data/` directory.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Sprint, DataProvider } from '@/types';

const SPRINTS_DIR = path.join(process.cwd(), 'data', 'sprints');
const REPORTS_DIR = path.join(process.cwd(), 'data', 'reports');

export class LocalProvider implements DataProvider {
    constructor() {
        this.initDataDirs();
    }

    private async initDataDirs() {
        try {
            await fs.mkdir(SPRINTS_DIR, { recursive: true });
            await fs.mkdir(REPORTS_DIR, { recursive: true });
        } catch (error) {
            console.error("Failed to create data directories:", error);
            // In a real app, you might want to throw this error to prevent the app from starting
            // if the data directories cannot be created.
        }
    }

    async getSprints(): Promise<Sprint[]> {
        try {
            const sprintFiles = await fs.readdir(SPRINTS_DIR);
            const sprintsData = await Promise.all(
                sprintFiles
                    .filter(file => file.endsWith('.json'))
                    .map(async file => {
                        const filePath = path.join(SPRINTS_DIR, file);
                        const fileContent = await fs.readFile(filePath, 'utf-8');
                        return JSON.parse(fileContent) as Sprint;
                    })
            );
            return sprintsData.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        } catch (error) {
            // If the directory doesn't exist, it's not an error, just return empty.
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return [];
            }
            console.error("Failed to read sprints from file system:", error);
            return [];
        }
    }

    async getSprintWithReport(sprintId: string): Promise<{ sprint: Sprint | null; reportContent: string | null }> {
        try {
            const filePath = path.join(SPRINTS_DIR, `${sprintId}.json`);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const sprint = JSON.parse(fileContent) as Sprint;

            let reportContent: string | null = null;
            if (sprint.reportFilePaths && sprint.reportFilePaths.length > 0) {
                // Get the most recent report
                const latestReportPath = sprint.reportFilePaths[sprint.reportFilePaths.length - 1];
                const fullReportPath = path.join(process.cwd(), latestReportPath);
                try {
                    reportContent = await fs.readFile(fullReportPath, 'utf-8');
                } catch (reportError) {
                    console.error(`Could not read report file at ${fullReportPath}:`, reportError);
                    // Don't fail the whole operation if the report is missing
                }
            }
            return { sprint, reportContent };
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.error(`Failed to read sprint ${sprintId}:`, error);
            }
            return { sprint: null, reportContent: null };
        }
    }

    async addSprint(sprintData: Omit<Sprint, 'id' | 'lastUpdatedAt'>): Promise<Sprint> {
        const sprintId = uuidv4();
        const newSprint: Sprint = {
            ...sprintData,
            id: sprintId,
            lastUpdatedAt: new Date().toISOString(),
        };
        const filePath = path.join(SPRINTS_DIR, `${sprintId}.json`);
        await fs.writeFile(filePath, JSON.stringify(newSprint, null, 2));
        return newSprint;
    }

    async updateSprint(sprintId: string, sprintData: Partial<Omit<Sprint, 'id'>>): Promise<Sprint> {
        const { sprint: existingSprint } = await this.getSprintWithReport(sprintId);
        if (!existingSprint) {
            throw new Error(`Sprint with ID ${sprintId} not found.`);
        }
        const updatedSprint: Sprint = {
            ...existingSprint,
            ...sprintData,
            lastUpdatedAt: new Date().toISOString(),
        };
        const filePath = path.join(SPRINTS_DIR, `${sprintId}.json`);
        await fs.writeFile(filePath, JSON.stringify(updatedSprint, null, 2));
        return updatedSprint;
    }

    async deleteSprint(sprintId: string): Promise<void> {
        const { sprint } = await this.getSprintWithReport(sprintId);

        // Delete associated report files
        if (sprint?.reportFilePaths) {
            for (const reportPath of sprint.reportFilePaths) {
                try {
                    await fs.unlink(path.join(process.cwd(), reportPath));
                } catch (err) {
                    // Log error but don't stop the deletion process
                    console.error(`Failed to delete report file ${reportPath}:`, err);
                }
            }
        }
        
        // Delete the main sprint JSON file
        try {
            await fs.unlink(path.join(SPRINTS_DIR, `${sprintId}.json`));
        } catch (err) {
            console.error(`Failed to delete sprint file for ${sprintId}:`, err);
        }
    }

    async saveReport(sprintId: string, reportContent: string): Promise<{ updatedSprint: Sprint, reportContent: string }> {
        const reportFileName = `sprint-report-${sprintId}-${Date.now()}.md`;
        const reportRelativePath = path.join('data', 'reports', reportFileName);
        const reportFullPath = path.join(process.cwd(), reportRelativePath);

        await fs.writeFile(reportFullPath, reportContent, 'utf-8');

        const { sprint: existingSprint } = await this.getSprintWithReport(sprintId);
        if (!existingSprint) {
            throw new Error("Cannot save report for a non-existent sprint.");
        }
        
        const newReportPaths = [...(existingSprint.reportFilePaths || []), reportRelativePath];
        const updatedSprint = await this.updateSprint(sprintId, { reportFilePaths: newReportPaths });

        return { updatedSprint, reportContent };
    }
}
