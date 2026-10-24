import type { ApprovalItem } from '@/types'

export const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: 'app-001',
    studentRollNumber: '23L31A5402',
    studentName: 'Bhavya Reddy',
    sectionName: 'Residence & Transportation',
    submissionDate: '2026-10-23',
    status: 'Pending',
    oldValues: {
      'Residence Type': 'Living at home / day scholar',
      'Present Address': 'H.No 12-4-56, Ram Nagar, Anakapalle',
      'Transport Mode': 'RTC / Public Bus',
    },
    proposedValues: {
      'Residence Type': 'College hostel',
      'Present Address': 'VIIT Campus Girls Hostel, Block B, Room 204',
      'Transport Mode': 'Walking',
    },
    adminComments: 'Pending verification with Hostel Warden allotment list.',
  },
  {
    id: 'app-002',
    studentRollNumber: '23L31A5403',
    studentName: 'Chirag Varma',
    sectionName: 'Personal Information & Contact',
    submissionDate: '2026-10-21',
    status: 'Changes Requested',
    oldValues: {
      'Contact Mobile': '+91 99890 23451',
      'Present Address': 'Sheela Nagar, Visakhapatnam',
    },
    proposedValues: {
      'Contact Mobile': '+91 99890 99999',
      'Present Address': 'Flat 302, Sai Balaji Enclave, Sheela Nagar',
    },
    adminComments: 'Please submit parent contact confirmation before mobile number update.',
  },
  {
    id: 'app-003',
    studentRollNumber: '23L31A5407',
    studentName: 'Goutham Teja N',
    sectionName: 'Educational Background (Lateral Entry)',
    submissionDate: '2026-10-22',
    status: 'Pending',
    oldValues: {
      'Class 10 Percentage': '91.0%',
      'Intermediate': 'Not Applicable',
      'Diploma College': 'Pending Document Verification',
    },
    proposedValues: {
      'Class 10 Percentage': '91.0%',
      'Diploma College': 'Govt Polytechnic College, Visakhapatnam',
      'Diploma Specialization': 'Computer Engineering (83.5%)',
      'ECET Rank': '284',
    },
    adminComments: 'ECET Rank card and SBTET Diploma marks memo uploaded for review.',
  },
  {
    id: 'app-004',
    studentRollNumber: '23L31A5401',
    studentName: 'Aarav Sharma',
    sectionName: 'Skills & Certifications',
    submissionDate: '2026-10-18',
    status: 'Approved',
    oldValues: {
      'Certifications': 'HackerRank Problem Solving 5 Stars',
    },
    proposedValues: {
      'Certifications': 'HackerRank 5 Stars, DeepLearning.AI Machine Learning Specialization',
    },
    adminComments: 'Verified Coursera certificate link.',
  },
]
