import type { AnnouncementItem, ChatMessage } from '@/types'

export const MOCK_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-1',
    title: 'Semester 2-1 Mid-1 Examination Schedule Released',
    content: 'The Mid-1 internal assessment schedule has been published on the departmental board. Examinations commence from Monday, 3rd November. Review syllabus guidelines with your subject coordinators.',
    date: '2026-10-23',
    author: 'J. Siddartha Varma (Faculty Mentor)',
    priority: 'Urgent',
    category: 'Academic',
    reactionsCount: 34,
  },
  {
    id: 'ann-2',
    title: 'Weekly Mentoring Slot Booking for Section A & B',
    content: 'All second-year CSE-DS mentees must review their pending commitments before attending their assigned session. Slots run every Tuesday & Thursday between 3:30 PM to 4:45 PM.',
    date: '2026-10-21',
    author: 'J. Siddartha Varma (Faculty Mentor)',
    priority: 'Important',
    category: 'Mentoring',
    reactionsCount: 28,
  },
  {
    id: 'ann-3',
    title: 'Daily Attendance Check-in Window Reminder (10:30 AM IST)',
    content: 'Remember to complete your daily morning attendance and mood check-in on the portal between 10:30 AM and 11:15 AM Monday through Saturday.',
    date: '2026-10-18',
    author: 'Department Mentoring Coordinator',
    priority: 'Normal',
    category: 'Notice',
    reactionsCount: 42,
  },
]

export const MOCK_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  // Aarav Sharma
  '23L31A5401': [
    {
      id: 'm1',
      senderRole: 'mentor',
      senderName: 'J. Siddartha Varma',
      content: 'Aarav, I checked your literature survey outline. The direction on Graph Neural Networks looks very promising.',
      timestamp: 'Yesterday at 4:15 PM',
      isPrivate: true,
    },
    {
      id: 'm2',
      senderRole: 'student',
      senderName: 'Aarav Sharma',
      content: 'Thank you Sir! I have added references to two 2024 IEEE papers. Will bring the printouts to our session on Wednesday.',
      timestamp: 'Yesterday at 4:40 PM',
      isPrivate: true,
    },
    {
      id: 'm3',
      senderRole: 'mentor',
      senderName: 'J. Siddartha Varma',
      content: 'Excellent. Also remember to submit the weekly discrete maths proofs before Friday noon.',
      timestamp: 'Today at 9:15 AM',
      isPrivate: true,
    },
  ],
  // Divya Sri Patnala
  '23L31A5404': [
    {
      id: 'm4',
      senderRole: 'student',
      senderName: 'Divya Sri Patnala',
      content: 'Respected Sir, I have submitted the physical medical fitness certificate to the department office this morning.',
      timestamp: '2 days ago at 11:20 AM',
      isPrivate: true,
    },
    {
      id: 'm5',
      senderRole: 'mentor',
      senderName: 'J. Siddartha Varma',
      content: 'Received, Divya. I have endorsed it and forwarded to the HOD office. Please prioritize catching up with the COA tutorial notes.',
      timestamp: '2 days ago at 2:05 PM',
      isPrivate: true,
    },
    {
      id: 'm6',
      senderRole: 'student',
      senderName: 'Divya Sri Patnala',
      content: 'Thank you very much Sir, I will attend the special tutorial hour tomorrow.',
      timestamp: 'Yesterday at 10:10 AM',
      isPrivate: true,
    },
  ],
}
