'use server';

import type { Sprint, Ticket } from '@/types';
import { getProvider } from '@/data/provider';
import { updateSprint as syncSprintToFirebase } from '@/lib/firebase/sprints';


const dataProvider = getProvider();

export async function getSprints(): Promise<Sprint[]> {
    return dataProvider.getSprints();
}

export async function getSprintWithReport(sprintId: string): Promise<{ sprint: Sprint | null; reportContent: string | null }> {
    return dataProvider.getSprintWithReport(sprintId);
}

export async function addSprint(sprintData: Omit<Sprint, 'id' | 'lastUpdatedAt'>): Promise<Sprint> {
    return dataProvider.addSprint(sprintData);
}

export async function updateSprint(sprintId: string, sprintData: Partial<Omit<Sprint, 'id'>>): Promise<Sprint> {
    return dataProvider.updateSprint(sprintId, sprintData);
}

export async function deleteSprint(sprintId: string): Promise<void> {
    return dataProvider.deleteSprint(sprintId);
}

export async function saveReport(sprintId: string, reportContent: string): Promise<{ updatedSprint: Sprint, reportContent: string }> {
    return dataProvider.saveReport(sprintId, reportContent);
}

export async function syncSprint(sprintId: string): Promise<Sprint> {
    const { sprint } = await dataProvider.getSprintWithReport(sprintId);
    if (!sprint) {
        throw new Error(`Cannot sync sprint ${sprintId}: not found locally.`);
    }
    await syncSprintToFirebase(sprint.id, sprint);
    return dataProvider.updateSprint(sprintId, { isSyncedToFirebase: true });
}
