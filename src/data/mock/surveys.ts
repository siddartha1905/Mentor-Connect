import type { FormSurveyItem } from '@/types'

export const MOCK_SURVEYS: FormSurveyItem[] = [
  {
    id: 'srv-1',
    title: 'Mid-Semester Course Feedback & Lab Facility Survey',
    description: 'Anonymous departmental survey to gather feedback on Semester 2-1 theory subjects, lab practical infrastructure, and difficulty pace.',
    targetCohort: 'CSE-DS 2nd Year (All Sections)',
    deadline: '2026-11-05',
    status: 'Active',
    questionsCount: 8,
    responseCount: 29,
    totalEligible: 40,
  },
  {
    id: 'srv-2',
    title: 'Technical Career Track & Elective Preference Poll',
    description: 'Survey to gauge student interest in upcoming 3-1 professional electives: Deep Learning vs Big Data Engineering vs Cloud Native Architectures.',
    targetCohort: 'CSE-DS 2nd Year',
    deadline: '2026-11-12',
    status: 'Active',
    questionsCount: 5,
    responseCount: 36,
    totalEligible: 40,
  },
  {
    id: 'srv-3',
    title: 'Hostel & Commute Satisfaction Check-in (Q1)',
    description: 'Periodic welfare assessment regarding day scholar transportation timing and college hostel amenities.',
    targetCohort: 'All Mentees',
    deadline: '2026-10-15',
    status: 'Closed',
    questionsCount: 6,
    responseCount: 38,
    totalEligible: 40,
  },
]
