'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Sprint } from '@/types';
import { updateSprint as syncSprintToFirebase } from '@/lib/firebase/sprints';

const SPRINTS_DIR = path.join(process.cwd(), 'data', 'sprints');
const REPORTS_DIR = path.join(process.cwd(), 'data', 'reports');

async function initDataDirs() {
    try {
        await fs.mkdir(SPRINTS_DIR, { recursive: true });
        await fs.mkdir(REPORTS_DIR, { recursive: true });
    } catch (error) {
        console.error("Failed to create data directories:", error);
    }
}

export async function getSprints(): Promise<Sprint[]> {
    await initDataDirs();
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
        console.error("Failed to read sprints from file system:", error);
        return [];
    }
}

export async function getSprintWithReport(sprintId: string): Promise<{ sprint: Sprint | null; reportContent: string | null }> {
    await initDataDirs();
    try {
        const filePath = path.join(SPRINTS_DIR, `${sprintId}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const sprint = JSON.parse(fileContent) as Sprint;

        let reportContent: string | null = null;
        if (sprint.reportFilePaths && sprint.reportFilePaths.length > 0) {
            const latestReportPath = sprint.reportFilePaths[sprint.reportFilePaths.length - 1];
            const fullReportPath = path.join(process.cwd(), latestReportPath);
            try {
                reportContent = await fs.readFile(fullReportPath, 'utf-8');
            } catch (reportError) {
                console.error(`Could not read report file at ${fullReportPath}:`, reportError);
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

export async function addSprint(sprintData: Omit<Sprint, 'id'>): Promise<Sprint> {
    await initDataDirs();
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

export async function updateSprint(sprintId: string, sprintData: Partial<Omit<Sprint, 'id'>>): Promise<Sprint> {
    await initDataDirs();
    const { sprint: existingSprint } = await getSprintWithReport(sprintId);
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

export async function deleteSprint(sprintId: string): Promise<void> {
    await initDataDirs();
    const { sprint } = await getSprintWithReport(sprintId);
    if (sprint?.reportFilePaths) {
        for (const reportPath of sprint.reportFilePaths) {
            try {
                await fs.unlink(path.join(process.cwd(), reportPath));
            } catch (err) {
                console.error(`Failed to delete report file ${reportPath}:`, err);
            }
        }
    }
    try {
        await fs.unlink(path.join(SPRINTS_DIR, `${sprintId}.json`));
    } catch (err) {
        console.error(`Failed to delete sprint file for ${sprintId}:`, err);
    }
}

export async function saveReport(sprintId: string, reportContent: string): Promise<{ updatedSprint: Sprint, reportContent: string }> {
    await initDataDirs();
    const reportFileName = `sprint-report-${sprintId}-${Date.now()}.md`;
    const reportRelativePath = path.join('data', 'reports', reportFileName);
    const reportFullPath = path.join(process.cwd(), reportRelativePath);

    await fs.writeFile(reportFullPath, reportContent, 'utf-8');

    const { sprint: existingSprint } = await getSprintWithReport(sprintId);
    if (!existingSprint) {
        throw new Error("Cannot save report for a non-existent sprint.");
    }
    
    const newReportPaths = [...(existingSprint.reportFilePaths || []), reportRelativePath];
    const updatedSprint = await updateSprint(sprintId, { reportFilePaths: newReportPaths });

    return { updatedSprint, reportContent };
}


export async function syncSprint(sprintId: string): Promise<Sprint> {
    const { sprint } = await getSprintWithReport(sprintId);
    if (!sprint) {
        throw new Error(`Cannot sync sprint ${sprintId}: not found locally.`);
    }
    await syncSprintToFirebase(sprint.id, sprint);
    return updateSprint(sprintId, { isSyncedToFirebase: true });
}
