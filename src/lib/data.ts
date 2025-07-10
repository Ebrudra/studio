
import type { Sprint, Team } from '@/types';
import { eachDayOfInterval, isSaturday, isSunday } from 'date-fns';
import { assigneeConfig } from './config';

export const teams: { value: Team, label: string }[] = [
    { value: "Backend", label: "Backend" },
    { value: "iOS", label: "iOS" },
    { value: "Web", label: "Web" },
    { value: "Android", label: "Android" },
];

export const sprints: Sprint[] = [];
