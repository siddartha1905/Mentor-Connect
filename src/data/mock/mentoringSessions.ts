import type { MentoringSession } from '@/types'

export const MOCK_SESSIONS: MentoringSession[] = [
  {
    id: 'sess-001',
    studentRollNumber: '23L31A5401',
    sessionNumber: 3,
    date: '2026-10-14',
    facultyName: 'Dr. K. S. Rao',
    beforeSession: {
      previousDiscussionSummary: 'Reviewed performance in Semester 1-2. Student expressed deep interest in Machine Learning pathways.',
      pendingCommitments: [
        'Complete Exploratory Data Analysis notebook on Kaggle dataset',
        'Enroll in open-source Python study circle',
      ],
      suggestedQuestions: [
        'How is your progress balancing Discrete Math proofs with Python lab tasks?',
        'Did you get an opportunity to review the research paper link shared last week?',
      ],
    },
    duringSession: {
      attendanceMarked: 'Present',
      academicConcerns: 'No major academic difficulty. Minor doubts in Graph theory proofs.',
      personalSupportConcerns: 'Well-adjusted day scholar. Good peer group in Section A.',
      confidentialMentorNotes: 'Student shows high intellectual self-direction. Potential candidate for departmental R&D project grant recommendation.',
      studentVisibleSuggestions: 'Continue LeetCode daily practice. Connect with Assistant Professor for paper survey guidance.',
    },
    afterSession: {
      commitments: [
        { id: 'c1', task: 'Submit literature review draft of 2 papers', owner: 'student', dueDate: '2026-11-05', isCompleted: false },
        { id: 'c2', task: 'Connect student with 4th year senior in ML track', owner: 'mentor', dueDate: '2026-10-28', isCompleted: true },
      ],
      outcome: 'Resolved',
      nextFollowUpDate: '2026-10-28',
    },
  },
  {
    id: 'sess-002',
    studentRollNumber: '23L31A5403',
    sessionNumber: 4,
    date: '2026-10-12',
    facultyName: 'Dr. K. S. Rao',
    beforeSession: {
      previousDiscussionSummary: 'Addressed Sem 1-2 Applied Physics backlog and irregular morning class attendance.',
      pendingCommitments: [
        'Attend Physics tutorial extra classes on alternate Saturdays',
        'Maintain daily study log of at least 90 minutes',
      ],
      suggestedQuestions: [
        'Have you collected the previous year question bank for Applied Physics?',
        'Are travel delays still impacting your 9:00 AM attendance in 2-1?',
      ],
    },
    duringSession: {
      attendanceMarked: 'Present',
      academicConcerns: 'Struggling with problem solving speed in Computer Organization and Discrete Mathematics.',
      personalSupportConcerns: 'Commuting by personal two-wheeler from Sheela Nagar; feeling fatigued by evening.',
      confidentialMentorNotes: 'Needs structured milestone supervision. Advised student to avoid excessive late-night screen time. Parent interaction recommended if Mid-1 marks fall below 18.',
      studentVisibleSuggestions: 'Focus on 2 backlog topics every weekend. Form study pair with peer in your colony.',
    },
    afterSession: {
      commitments: [
        { id: 'c3', task: 'Solve 10 sample problems from Unit 1 & 2 of Physics', owner: 'student', dueDate: '2026-10-26', isCompleted: false },
        { id: 'c4', task: 'Provide past 3 years solved university papers', owner: 'mentor', dueDate: '2026-10-18', isCompleted: true },
      ],
      outcome: 'Follow-up Required',
      nextFollowUpDate: '2026-10-27',
    },
  },
  {
    id: 'sess-003',
    studentRollNumber: '23L31A5404',
    sessionNumber: 5,
    date: '2026-10-10',
    facultyName: 'Dr. K. S. Rao',
    beforeSession: {
      previousDiscussionSummary: 'Severe viral fever caused absence for nearly 12 days in September, dropping attendance to 71.8%.',
      pendingCommitments: [
        'Submit medical fitness certificate endorsed by Government Hospital',
        'Request class notes from Section A class representative',
      ],
      suggestedQuestions: [
        'How is your physical recovery? Are you experiencing lingering fatigue?',
        'Which subjects feel most difficult to catch up on after the leave period?',
      ],
    },
    duringSession: {
      attendanceMarked: 'Present',
      academicConcerns: 'Anxious about attendance shortage condonation rules and upcoming Mid-1 tests.',
      personalSupportConcerns: 'Recovered from illness; parents were concerned about college bus travel exertion.',
      confidentialMentorNotes: 'Medical certificate verified and recommended for HOD condonation consideration. Student is sincere but needs academic morale boost.',
      studentVisibleSuggestions: 'Take one subject at a time. Faculty members in COA and Discrete Math are available during tutorial hour.',
    },
    afterSession: {
      commitments: [
        { id: 'c5', task: 'Submit parent acknowledgment letter for attendance recovery', owner: 'student', dueDate: '2026-10-24', isCompleted: true },
        { id: 'c6', task: 'Inform subject teachers to permit missed internal test retake', owner: 'mentor', dueDate: '2026-10-20', isCompleted: true },
        { id: 'c7', task: 'Maintain 95%+ attendance over the next 4 weeks', owner: 'student', dueDate: '2026-11-15', isCompleted: false },
      ],
      outcome: 'Follow-up Required',
      nextFollowUpDate: '2026-10-26',
    },
  },
  {
    id: 'sess-004',
    studentRollNumber: '23L31A5406',
    sessionNumber: 2,
    date: '2026-10-15',
    facultyName: 'Dr. K. S. Rao',
    beforeSession: {
      previousDiscussionSummary: 'Discussed career clarity and hesitation in asking doubts during large class lectures.',
      pendingCommitments: [
        'Volunteer to answer at least one question in DS lecture',
        'Prepare DSA lab practical records in advance',
      ],
      suggestedQuestions: [
        'Did you feel more comfortable participating in this week’s lab viva?',
        'How are your preparations for the upcoming Mid-1 assessments?',
      ],
    },
    duringSession: {
      attendanceMarked: 'Present',
      academicConcerns: 'Understands code logic on paper, but experiences anxiety during timed online compiler evaluations.',
      personalSupportConcerns: 'Mild exam anxiety. High self-imposed pressure to match elder sibling’s academic marks.',
      confidentialMentorNotes: 'Advised mock timed coding drills at home without pressure. Reassured student that conceptual grasp is sound.',
      studentVisibleSuggestions: 'Practise 2 coding problems daily on HackerRank easy track to build compiler speed.',
    },
    afterSession: {
      commitments: [
        { id: 'c8', task: 'Complete HackerRank Python 3-star badge', owner: 'student', dueDate: '2026-10-31', isCompleted: false },
      ],
      outcome: 'Resolved',
      nextFollowUpDate: '2026-10-30',
    },
  },
]
