
import type { Sprint, Team } from '@/types';
import { eachDayOfInterval, isSaturday, isSunday } from 'date-fns';
import { assigneeConfig } from './config';

export const teams: Team[] = ['Backend', 'iOS', 'Web', 'Android', 'Mobile'];

const generateSprintDays = (startDateStr: string, endDateStr: string) => {
    const days = [];
    let currentDate = new Date(startDateStr);
    // Add timezone offset to avoid off-by-one errors with date boundaries
    currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());
    const endDate = new Date(endDateStr);
    endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
    
    let dayCounter = 1;
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Sunday=0, Saturday=6
            days.push({ day: dayCounter++, date: currentDate.toISOString().split('T')[0] });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
};


export const sprints: Sprint[] = [
  {
    id: 'sprint-1',
    name: 'Q3 Sprint 1 (July 8 - July 21)',
    startDate: '2024-07-08',
    endDate: '2024-07-21',
    sprintDays: generateSprintDays('2024-07-08', '2024-07-21'),
    status: 'Active',
    lastUpdatedAt: new Date('2024-07-15T10:00:00Z').toISOString(),
    teamCapacity: {
      'Backend': { plannedBuild: 60, plannedRun: 12 },
      'iOS': { plannedBuild: 54, plannedRun: 10 },
      'Web': { plannedBuild: 60, plannedRun: 12 },
      'Android': { plannedBuild: 48, plannedRun: 8 },
      'Mobile': { plannedBuild: 30, plannedRun: 2 },
      'Out of Scope': { plannedBuild: 0, plannedRun: 0 },
    },
    tickets: [
      { id: 'WIN-5929', title: 'Implement new login flow', description: 'Create secure login/logout functionality with JWT tokens and password reset.', scope: 'Web', assignee: assigneeConfig.Web, type: 'User story', typeScope: 'Build', estimation: 8, timeLogged: 8, status: 'Done', tags: ['auth', 'frontend'], completionDate: '2024-07-09T10:00:00.000Z', dailyLogs: [{ date: '2024-07-09', loggedHours: 8 }] },
      { id: 'WIN-5930', title: 'Fix API authentication issue', description: 'Users are unable to log in due to a token validation error in the main API.', scope: 'Backend', assignee: assigneeConfig.Backend, type: 'Bug', typeScope: 'Run', estimation: 5, timeLogged: 6, status: 'Done', tags: ['bug', 'security'], completionDate: '2024-07-10T10:00:00.000Z', dailyLogs: [{ date: '2024-07-10', loggedHours: 6 }] },
      { id: 'WIN-5931', title: 'Update home screen UI', description: 'Redesign the home screen to include new promotional banners and a carousel.', scope: 'iOS', assignee: assigneeConfig.iOS, type: 'User story', typeScope: 'Build', estimation: 13, timeLogged: 13, status: 'Done', tags: ['ui', 'ux'], completionDate: '2024-07-11T10:00:00.000Z', dailyLogs: [{ date: '2024-07-11', loggedHours: 13 }] },
      { id: 'WIN-5932', title: 'Add push notification support', description: 'Integrate with Firebase Cloud Messaging to enable push notifications.', scope: 'Android', assignee: assigneeConfig.Android, type: 'User story', typeScope: 'Build', estimation: 8, timeLogged: 8, status: 'Done', tags: ['notifications', 'firebase'], completionDate: '2024-07-12T10:00:00.000Z', dailyLogs: [{ date: '2024-07-12', loggedHours: 8 }] },
      { id: 'WIN-5933', title: 'Refactor user service', description: 'Improve the performance and maintainability of the user management service.', scope: 'Backend', assignee: assigneeConfig.Backend, type: 'Task', typeScope: 'Build', estimation: 13, timeLogged: 10, status: 'Doing', tags: ['refactor', 'backend'], dailyLogs: [{ date: '2024-07-13', loggedHours: 5 }, { date: '2024-07-14', loggedHours: 5 }] },
      { id: 'WIN-5934', title: 'Investigate payment gateway errors', description: 'Users are reporting intermittent failures during the checkout process.', scope: 'Web', assignee: assigneeConfig.Web, type: 'Task', typeScope: 'Run', estimation: 8, timeLogged: 4, status: 'Doing', tags: ['payments', 'investigation'], dailyLogs: [{ date: '2024-07-14', loggedHours: 4 }] },
      { id: 'WIN-5935', title: 'Design new profile page', description: 'Create mockups and prototypes for the new user profile page.', scope: 'Mobile', assignee: assigneeConfig.Mobile, type: 'User story', typeScope: 'Build', estimation: 5, timeLogged: 0, status: 'To Do', tags: ['design', 'mobile'], dailyLogs: [] },
      { id: 'WIN-5936', title: 'Onboarding tutorial implementation', description: 'Build the multi-step tutorial for new users on iOS.', scope: 'iOS', assignee: assigneeConfig.iOS, type: 'User story', typeScope: 'Build', estimation: 8, timeLogged: 0, status: 'To Do', tags: ['onboarding', 'ux'], dailyLogs: [] },
      { id: 'WIN-5937', title: 'Sprint planning & admin', description: 'Buffer time for sprint ceremonies and administrative tasks.', scope: 'Backend', assignee: assigneeConfig.Backend, type: 'Buffer', typeScope: 'Sprint', estimation: 10, timeLogged: 5, status: 'Doing', tags: ['admin', 'planning'], dailyLogs: [{ date: '2024-07-08', loggedHours: 5 }] },
      { id: 'WIN-5938', title: 'Add new endpoint for user data', description: 'Create a new GET endpoint to fetch user profile information.', scope: 'Backend', assignee: assigneeConfig.Backend, type: 'User story', typeScope: 'Build', estimation: 8, timeLogged: 8, status: 'Done', tags: ['api'], completionDate: '2024-07-15T10:00:00.000Z', dailyLogs: [{ date: '2024-07-15', loggedHours: 8 }] },
      { id: 'WIN-5939', title: 'Optimize image loading on Android', description: 'Improve image loading times and reduce memory usage on the main feed.', scope: 'Android', assignee: assigneeConfig.Android, type: 'Task', typeScope: 'Run', estimation: 5, timeLogged: 5, status: 'Done', tags: ['performance', 'android'], completionDate: '2024-07-15T10:00:00.000Z', dailyLogs: [{ date: '2024-07-15', loggedHours: 5 }] },
      { id: 'WIN-5940', title: 'Fix CSS bug on marketing page', description: 'The main banner on the marketing page is misaligned on mobile devices.', scope: 'Web', assignee: assigneeConfig.Web, type: 'Bug', typeScope: 'Run', estimation: 3, timeLogged: 3, status: 'Done', tags: ['css', 'bugfix'], completionDate: '2024-07-15T10:00:00.000Z', dailyLogs: [{ date: '2024-07-15', loggedHours: 3 }] },
    ],
  },
  {
    id: 'sprint-2',
    name: 'Q3 Sprint 2 (July 22 - Aug 4)',
    startDate: '2024-07-22',
    endDate: '2024-08-04',
    sprintDays: generateSprintDays('2024-07-22', '2024-08-04'),
    status: 'Active',
    lastUpdatedAt: new Date().toISOString(),
     teamCapacity: {
      'Backend': { plannedBuild: 60, plannedRun: 12 },
      'iOS': { plannedBuild: 60, plannedRun: 12 },
      'Web': { plannedBuild: 60, plannedRun: 12 },
      'Android': { plannedBuild: 60, plannedRun: 12 },
      'Mobile': { plannedBuild: 60, plannedRun: 12 },
      'Out of Scope': { plannedBuild: 0, plannedRun: 0 },
    },
    tickets: [
      { id: 'WIN-6001', title: 'User profile page redesign', description: 'Implement the approved designs for the new user profile page.', scope: 'Web', assignee: assigneeConfig.Web, type: 'User story', typeScope: 'Build', estimation: 13, timeLogged: 0, status: 'To Do', tags: ['ui', 'frontend'], dailyLogs: [] },
      { id: 'WIN-6002', title: 'Database migration script', description: 'Write and test a script to migrate legacy data to the new database schema.', scope: 'Backend', assignee: assigneeConfig.Backend, type: 'Task', typeScope: 'Build', estimation: 21, timeLogged: 0, status: 'To Do', tags: ['database', 'migration'], dailyLogs: [] },
      { id: 'WIN-6003', title: 'iOS 18 compatibility fixes', description: 'Address UI bugs and crashes reported on the iOS 18 beta.', scope: 'iOS', assignee: assigneeConfig.iOS, type: 'Task', typeScope: 'Run', estimation: 8, timeLogged: 0, status: 'To Do', tags: ['ios', 'compatibility'], dailyLogs: [] },
      { id: 'WIN-6004', title: 'Improve Android app startup time', description: 'Profile and optimize the app startup sequence to improve performance.', scope: 'Android', assignee: assigneeConfig.Android, type: 'Task', typeScope: 'Run', estimation: 5, timeLogged: 0, status: 'To Do', tags: ['performance', 'android'], dailyLogs: [] },
    ],
  },
];
