import { db } from './config';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, getDoc, query, orderBy } from 'firebase/firestore';
import type { Sprint } from '@/types';

/**
 * @fileOverview Firebase Firestore service for Sprint data.
 * These functions are used for syncing completed sprints to the cloud for archival.
 * The primary data source for the application is the local file system.
 */

const sprintsCollection = collection(db, 'sprints');

/**
 * Fetches all sprints that have been synced to Firebase, ordered by start date.
 * @returns A promise that resolves to an array of synced sprints.
 */
export async function getSyncedSprints(): Promise<Sprint[]> {
    const q = query(sprintsCollection, orderBy("startDate", "desc"));
    const snapshot = await getDocs(q);
    const sprints = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Sprint));
    return sprints;
}

/**
 * Fetches a single sprint from Firebase by its ID.
 * @param sprintId The ID of the sprint to fetch.
 * @returns A promise that resolves to the sprint data or null if not found.
 */
export async function getSprint(sprintId: string): Promise<Sprint | null> {
    const sprintDoc = await getDoc(doc(db, 'sprints', sprintId));
    if (sprintDoc.exists()) {
        return { id: sprintDoc.id, ...sprintDoc.data() } as Sprint;
    }
    return null;
}

/**
 * Creates or updates a sprint document in Firebase. Used for syncing.
 * @param sprintId The ID of the sprint to create or update.
 * @param sprintData The full or partial sprint data to save.
 */
export async function updateSprint(sprintId: string, sprintData: Partial<Sprint>): Promise<void> {
    const sprintDoc = doc(db, 'sprints', sprintId);
    // Using setDoc with merge:true will create the doc if it doesn't exist,
    // or update it if it does. This is perfect for our sync operation.
    await setDoc(sprintDoc, sprintData, { merge: true });
}

/**
 * Deletes a sprint document from Firebase.
 * @param sprintId The ID of the sprint to delete.
 */
export async function deleteSprint(sprintId: string): Promise<void> {
    const sprintDoc = doc(db, 'sprints', sprintId);
    await deleteDoc(sprintDoc);
}
