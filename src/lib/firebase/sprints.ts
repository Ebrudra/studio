import { db } from './config';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, getDoc, query, orderBy } from 'firebase/firestore';
import type { Sprint } from '@/types';

const sprintsCollection = collection(db, 'sprints');

export async function getSprints(): Promise<Sprint[]> {
    const q = query(sprintsCollection, orderBy("startDate", "desc"));
    const snapshot = await getDocs(q);
    const sprints = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Sprint));
    return sprints;
}

export async function getSprint(sprintId: string): Promise<Sprint | null> {
    const sprintDoc = await getDoc(doc(db, 'sprints', sprintId));
    if (sprintDoc.exists()) {
        return { id: sprintDoc.id, ...sprintDoc.data() } as Sprint;
    }
    return null;
}

export async function addSprint(sprintData: Omit<Sprint, 'id' | 'lastUpdatedAt'>): Promise<string> {
    const docRef = await addDoc(sprintsCollection, {
        ...sprintData,
        lastUpdatedAt: new Date().toISOString(),
    });
    return docRef.id;
}

export async function updateSprint(sprintId: string, sprintData: Partial<Sprint>): Promise<void> {
    const sprintDoc = doc(db, 'sprints', sprintId);
    await setDoc(sprintDoc, sprintData, { merge: true });
}

export async function deleteSprint(sprintId: string): Promise<void> {
    const sprintDoc = doc(db, 'sprints', sprintId);
    await deleteDoc(sprintDoc);
}
