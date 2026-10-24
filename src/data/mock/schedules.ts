import type { AutomatedScheduleRule } from '@/types'

export const MOCK_SCHEDULES: AutomatedScheduleRule[] = [
  {
    id: 'sch-1',
    title: 'Daily Morning Attendance & Wellness Check-in',
    scheduleTime: '10:30 AM IST',
    frequency: 'Monday – Saturday (Excl. Holidays)',
    targetGroup: 'All CSE-DS Mentees (38 Students)',
    isActive: true,
    templateSnippet: 'Good morning! Please mark your presence for today and mention any academic or travel difficulty encountered.',
    category: 'Attendance Check-in',
  },
  {
    id: 'sch-2',
    title: 'Midweek Motivational Growth Quote',
    scheduleTime: '08:45 AM IST',
    frequency: 'Every Wednesday',
    targetGroup: 'All CSE-DS Students',
    isActive: true,
    templateSnippet: 'Small disciplined efforts repeated each day yield extraordinary semester results. Have a productive Wednesday!',
    category: 'Motivational',
  },
  {
    id: 'sch-3',
    title: 'Mentoring Action Commitment Reminder',
    scheduleTime: '05:00 PM IST',
    frequency: 'Every Friday',
    targetGroup: 'Students with Pending Commitments (4 Students)',
    isActive: true,
    templateSnippet: 'Hi {student_name}, this is a gentle reminder regarding your commitment: {commitment_title} due by next week.',
    category: 'Follow-up',
  },
  {
    id: 'sch-4',
    title: 'Weekly Internal Test Mark Submission Alert',
    scheduleTime: '09:00 AM IST',
    frequency: 'Every Saturday',
    targetGroup: 'Section A & B Subject Faculty',
    isActive: false,
    templateSnippet: 'Faculty Reminder: Please ensure Weekly Test marks (WT1–WT4) are entered before the weekend portal freeze.',
    category: 'Academic Reminder',
  },
]
