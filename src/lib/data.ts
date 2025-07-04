import type { Sprint, Team } from '@/types';

const teams: Team[] = ['Backend', 'iOS', 'Web', 'Android'];

export const sprints: Sprint[] = [
  {
    id: 'sprint-1',
    name: 'Q3 Sprint 1 (July 8 - July 21)',
    startDate: '2024-07-08',
    endDate: '2024-07-21',
    lastUpdatedAt: new Date('2024-07-15T10:00:00Z').toISOString(),
    tickets: [
      { id: 'WIN-5929', title: 'Implement new login flow', scope: 'Web', type: 'User story', typeScope: 'Build', estimation: 8, timeLogged: 8, status: 'Done' },
      { id: 'WIN-5930', title: 'Fix API authentication issue', scope: 'Backend', type: 'Bug', typeScope: 'Run', estimation: 5, timeLogged: 6, status: 'Done' },
      { id: 'WIN-5931', title: 'Update home screen UI', scope: 'iOS', type: 'User story', typeScope: 'Build', estimation: 13, timeLogged: 13, status: 'Done' },
      { id: 'WIN-5932', title: 'Add push notification support', scope: 'Android', type: 'User story', typeScope: 'Build', estimation: 8, timeLogged: 8, status: 'Done' },
      { id: 'WIN-5933', title: 'Refactor user service', scope: 'Backend', type: 'Task', typeScope: 'Build', estimation: 13, timeLogged: 10, status: 'In Progress' },
      { id: 'WIN-5934', title: 'Investigate payment gateway errors', scope: 'Web', type: 'Task', typeScope: 'Run', estimation: 8, timeLogged: 4, status: 'In Progress' },
      { id: 'WIN-5935', title: 'Design new profile page', scope: 'Mobile', type: 'User story', typeScope: 'Build', estimation: 5, timeLogged: 0, status: 'To Do' },
      { id: 'WIN-5936', title: 'Onboarding tutorial implementation', scope: 'iOS', type: 'User story', typeScope: 'Build', estimation: 8, timeLogged: 0, status: 'To Do' },
      { id: 'WIN-5937', title: 'Sprint planning & admin', scope: 'Backend', type: 'Buffer', typeScope: 'Sprint', estimation: 10, timeLogged: 5, status: 'In Progress' },
      { id: 'WIN-5938', title: 'Add new endpoint for user data', scope: 'Backend', type: 'User story', typeScope: 'Build', estimation: 8, timeLogged: 8, status: 'Done' },
      { id: 'WIN-5939', title: 'Optimize image loading on Android', scope: 'Android', type: 'Task', typeScope: 'Run', estimation: 5, timeLogged: 5, status: 'Done' },
      { id: 'WIN-5940', title: 'Fix CSS bug on marketing page', scope: 'Web', type: 'Bug', typeScope: 'Run', estimation: 3, timeLogged: 3, status: 'Done' },
    ],
    burnDownData: [
        { day: 1, date: '2024-07-08', ideal: 91, actual: 91, completed: 0, dailyCompletedByTeam: { Web: 0, Backend: 0, iOS: 0, Android: 0, Mobile: 0 } },
        { day: 2, date: '2024-07-09', ideal: 82.8, actual: 83, completed: 8, dailyCompletedByTeam: { Web: 8, Backend: 0, iOS: 0, Android: 0, Mobile: 0 } },
        { day: 3, date: '2024-07-10', ideal: 74.6, actual: 78, completed: 5, dailyCompletedByTeam: { Web: 0, Backend: 5, iOS: 0, Android: 0, Mobile: 0 } },
        { day: 4, date: '2024-07-11', ideal: 66.4, actual: 65, completed: 13, dailyCompletedByTeam: { Web: 0, Backend: 0, iOS: 13, Android: 0, Mobile: 0 } },
        { day: 5, date: '2024-07-12', ideal: 58.2, actual: 57, completed: 8, dailyCompletedByTeam: { Web: 0, Backend: 0, iOS: 0, Android: 8, Mobile: 0 } },
        { day: 6, date: '2024-07-13', ideal: 50, actual: 57, completed: 0, dailyCompletedByTeam: { Web: 0, Backend: 0, iOS: 0, Android: 0, Mobile: 0 } }, // Weekend
        { day: 7, date: '2024-07-14', ideal: 41.8, actual: 57, completed: 0, dailyCompletedByTeam: { Web: 0, Backend: 0, iOS: 0, Android: 0, Mobile: 0 } }, // Weekend + Scope Add
        { day: 8, date: '2024-07-15', ideal: 33.6, actual: 60, completed: 5, dailyCompletedByTeam: { Web: 0, Backend: 0, iOS: 0, Android: 5, Mobile: 0 } },
    ]
  },
  {
    id: 'sprint-2',
    name: 'Q3 Sprint 2 (July 22 - Aug 4)',
    startDate: '2024-07-22',
    endDate: '2024-08-04',
    lastUpdatedAt: new Date().toISOString(),
    tickets: [
      { id: 'WIN-6001', title: 'User profile page redesign', scope: 'Web', type: 'User story', typeScope: 'Build', estimation: 13, timeLogged: 0, status: 'To Do' },
      { id: 'WIN-6002', title: 'Database migration script', scope: 'Backend', type: 'Task', typeScope: 'Build', estimation: 21, timeLogged: 0, status: 'To Do' },
      { id: 'WIN-6003', title: 'iOS 18 compatibility fixes', scope: 'iOS', type: 'Task', typeScope: 'Run', estimation: 8, timeLogged: 0, status: 'To Do' },
      { id: 'WIN-6004', title: 'Improve Android app startup time', scope: 'Android', type: 'Task', typeScope: 'Run', estimation: 5, timeLogged: 0, status: 'To Do' },
    ],
    burnDownData: []
  },
];
