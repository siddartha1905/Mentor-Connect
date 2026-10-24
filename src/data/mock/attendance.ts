import type { AttendanceProfile } from '@/types'

export const MOCK_ATTENDANCE: Record<string, AttendanceProfile> = {
  // Aarav Sharma - High attendance (88.5%)
  '23L31A5401': {
    officialPercentage: 88.5,
    totalClassesHeld: 156,
    classesAttended: 138,
    lastUpdated: '2026-10-20',
    health: 'Good',
    discrepancyCount: 0,
    studentReportedCheckIns: [
      { date: '2026-10-24', status: 'Present', note: 'Attended all morning DS lab sessions' },
      { date: '2026-10-23', status: 'Present', note: 'Submitted Discrete Maths assignment' },
      { date: '2026-10-22', status: 'Present', note: 'Regular attendance' },
      { date: '2026-10-21', status: 'Present', note: 'Regular attendance' },
      { date: '2026-10-20', status: 'Present', note: 'Regular attendance' },
      { date: '2026-10-19', status: 'Absent', note: 'Attended AWS Community Day meetup' },
    ],
  },
  // Bhavya Reddy - 81.2% (Good, above 80%)
  '23L31A5402': {
    officialPercentage: 81.2,
    totalClassesHeld: 156,
    classesAttended: 127,
    lastUpdated: '2026-10-20',
    health: 'Good',
    discrepancyCount: 1,
    studentReportedCheckIns: [
      { date: '2026-10-24', status: 'Present', note: 'Hostel morning study completed' },
      { date: '2026-10-23', status: 'Present' },
      { date: '2026-10-22', status: 'Late', note: 'Arrived at 9:15 AM due to lab preparation' },
      { date: '2026-10-21', status: 'Present' },
      { date: '2026-10-20', status: 'Present' },
    ],
  },
  // Chirag Varma - 77.4% (Warning - below 80%)
  '23L31A5403': {
    officialPercentage: 77.4,
    totalClassesHeld: 156,
    classesAttended: 121,
    lastUpdated: '2026-10-20',
    health: 'Warning',
    discrepancyCount: 2,
    studentReportedCheckIns: [
      { date: '2026-10-24', status: 'Present', note: 'Regular classes' },
      { date: '2026-10-23', status: 'Absent', note: 'Bike breakdown on highway' },
      { date: '2026-10-22', status: 'Present' },
      { date: '2026-10-21', status: 'Absent', note: 'Self-study for backlog test' },
      { date: '2026-10-20', status: 'Present' },
    ],
  },
  // Divya Sri Patnala - 71.8% (Critical - below 75%)
  '23L31A5404': {
    officialPercentage: 71.8,
    totalClassesHeld: 156,
    classesAttended: 112,
    lastUpdated: '2026-10-20',
    health: 'Critical',
    discrepancyCount: 3,
    studentReportedCheckIns: [
      { date: '2026-10-24', status: 'Present', note: 'Met mentor after class' },
      { date: '2026-10-23', status: 'Present', note: 'Submitted medical certificate to mentor' },
      { date: '2026-10-22', status: 'Absent', note: 'Hospital visit / routine check-up' },
      { date: '2026-10-21', status: 'Present' },
      { date: '2026-10-20', status: 'Absent', note: 'Fever recovery' },
    ],
  },
  // Eshwar Prasad K - 93.0% (Exemplary)
  '23L31A5405': {
    officialPercentage: 93.0,
    totalClassesHeld: 156,
    classesAttended: 145,
    lastUpdated: '2026-10-20',
    health: 'Good',
    discrepancyCount: 0,
    studentReportedCheckIns: [
      { date: '2026-10-24', status: 'Present', note: 'Assisted peer DSA session' },
      { date: '2026-10-23', status: 'Present' },
      { date: '2026-10-22', status: 'Present' },
      { date: '2026-10-21', status: 'Present' },
      { date: '2026-10-20', status: 'Present' },
    ],
  },
  // Farhana Shaik - 84.0% (Good)
  '23L31A5406': {
    officialPercentage: 84.0,
    totalClassesHeld: 156,
    classesAttended: 131,
    lastUpdated: '2026-10-20',
    health: 'Good',
    discrepancyCount: 1,
    studentReportedCheckIns: [
      { date: '2026-10-24', status: 'Present' },
      { date: '2026-10-23', status: 'Present' },
      { date: '2026-10-22', status: 'Present' },
      { date: '2026-10-21', status: 'Present' },
      { date: '2026-10-20', status: 'Present' },
    ],
  },
  // Goutham Teja N - 80.5% (Borderline Good)
  '23L31A5407': {
    officialPercentage: 80.5,
    totalClassesHeld: 156,
    classesAttended: 126,
    lastUpdated: '2026-10-20',
    health: 'Good',
    discrepancyCount: 1,
    studentReportedCheckIns: [
      { date: '2026-10-24', status: 'Present' },
      { date: '2026-10-23', status: 'Present' },
      { date: '2026-10-22', status: 'Late', note: 'Public bus traffic delay' },
      { date: '2026-10-21', status: 'Present' },
      { date: '2026-10-20', status: 'Present' },
    ],
  },
}
