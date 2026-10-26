export interface ThoughtItem {
  id: number
  theme:
    | 'Consistency'
    | 'Resilience'
    | 'Learning'
    | 'Asking for Help'
    | 'Growth & Confidence'
    | 'Personal Development'
    | 'Academic Focus'
  text: string
}

export const MOTIVATIONAL_THOUGHTS: ThoughtItem[] = [
  {
    id: 1,
    theme: 'Consistency',
    text: 'Steady, focused effort each day builds quiet self-assurance over time.',
  },
  {
    id: 2,
    theme: 'Asking for Help',
    text: 'Asking for clarification is an active step toward mastery, never a sign of doubt.',
  },
  {
    id: 3,
    theme: 'Growth & Confidence',
    text: 'Real growth often feels unfamiliar while it is happening. Trust the learning curve.',
  },
  {
    id: 4,
    theme: 'Learning',
    text: 'Every complex discipline begins with simple questions. Deconstruct and keep going.',
  },
  {
    id: 5,
    theme: 'Resilience',
    text: 'Resilience is what grows when you meet an unexpected setback with curiosity instead of despair.',
  },
  {
    id: 6,
    theme: 'Consistency',
    text: 'Small daily habits compound into remarkable technical confidence across semesters.',
  },
  {
    id: 7,
    theme: 'Personal Development',
    text: 'Your faculty mentor is your navigator, but every milestone on the map belongs to you.',
  },
  {
    id: 8,
    theme: 'Academic Focus',
    text: 'A difficult problem is an invitation to deepen your conceptual understanding.',
  },
  {
    id: 9,
    theme: 'Growth & Confidence',
    text: 'True academic progress is measured against who you were yesterday, not anyone else.',
  },
  {
    id: 10,
    theme: 'Asking for Help',
    text: 'Reach out early when a concept feels unclear; collaborative dialogue creates clarity.',
  },
  {
    id: 11,
    theme: 'Academic Focus',
    text: 'Preparation transforms classroom anxiety into calm, steady competence.',
  },
  {
    id: 12,
    theme: 'Consistency',
    text: 'Celebrate incremental improvements; lasting capability is built step by steady step.',
  },
  {
    id: 13,
    theme: 'Learning',
    text: 'Mistakes in coursework are simply valuable data points guiding your next approach.',
  },
  {
    id: 14,
    theme: 'Resilience',
    text: 'Patience with yourself during difficult topics is essential to deep problem-solving.',
  },
  {
    id: 15,
    theme: 'Personal Development',
    text: 'Set realistic weekly targets, give each task your complete attention, and protect your rest.',
  },
  {
    id: 16,
    theme: 'Growth & Confidence',
    text: 'Honest self-reflection is the foundation of genuine intellectual maturity.',
  },
  {
    id: 17,
    theme: 'Learning',
    text: 'Curiosity keeps engineering alive; explore ideas that spark your genuine interest.',
  },
  {
    id: 18,
    theme: 'Resilience',
    text: 'When a semester feels demanding, pause, remember why you started, and take one steady step.',
  },
  {
    id: 19,
    theme: 'Asking for Help',
    text: 'Meaningful mentorship begins with openness and mutual respect.',
  },
  {
    id: 20,
    theme: 'Learning',
    text: 'Deep comprehension takes deliberate repetition. Give yourself time to internalize concepts.',
  },
  {
    id: 21,
    theme: 'Personal Development',
    text: 'Balance technical rigor with physical well-being; a refreshed mind solves problems faster.',
  },
  {
    id: 22,
    theme: 'Growth & Confidence',
    text: 'You do not need to know everything today; commit to learning what is in front of you.',
  },
  {
    id: 23,
    theme: 'Consistency',
    text: 'A disciplined study routine creates freedom and confidence when exam deadlines approach.',
  },
  {
    id: 24,
    theme: 'Academic Focus',
    text: 'Approach each lab and lecture with presence; engagement turns routines into insights.',
  },
  {
    id: 25,
    theme: 'Resilience',
    text: 'Progress is rarely linear; what matters is your willingness to begin again tomorrow.',
  },
  {
    id: 26,
    theme: 'Asking for Help',
    text: 'Sharing an academic struggle with your mentor often reveals that the solution is within reach.',
  },
  {
    id: 27,
    theme: 'Growth & Confidence',
    text: 'Confidence is not the absence of uncertainty; it is the courage to take action anyway.',
  },
  {
    id: 28,
    theme: 'Personal Development',
    text: 'Take pride in the skills you are quietly building; your future career is taking shape right now.',
  },
]

const TEN_MINUTES_MS = 10 * 60 * 1000

export function getCurrentThoughtIndex(total: number = MOTIVATIONAL_THOUGHTS.length): number {
  return Math.floor(Date.now() / TEN_MINUTES_MS) % total
}
