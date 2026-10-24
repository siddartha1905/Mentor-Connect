import type { MotivationalQuote } from '@/types'

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    quote: 'Your future is built by what you practise today, not tomorrow.',
    author: 'Faculty Mentor Note',
    focus: 'Consistency',
  },
  {
    quote: "Progress doesn't need to be loud to be deeply meaningful.",
    author: 'Mentorship Reflection',
    focus: 'Steady Growth',
  },
  {
    quote: 'Every question you ask is another confident step toward deeper understanding.',
    author: 'Learning Mindset',
    focus: 'Curiosity',
  },
  {
    quote: 'Small disciplined efforts repeated each day yield extraordinary semester results.',
    author: 'Academic Guidance',
    focus: 'Discipline',
  },
  {
    quote: 'Setbacks are merely diagnostic data points guiding your next refinement.',
    author: 'Engineering Wisdom',
    focus: 'Resilience',
  },
  {
    quote: 'Collaborate with openness, build with passion, and learn with quiet humility.',
    author: 'Campus Tech Values',
    focus: 'Excellence',
  },
  {
    quote: 'Master the fundamentals today; the complex technologies of tomorrow will follow effortlessly.',
    author: 'Data Science Faculty',
    focus: 'Fundamentals',
  },
]

/**
 * Returns a deterministic quote for the current calendar day
 * so the quote stays consistent throughout the day without jarring carousels.
 */
export function getDailyQuote(): MotivationalQuote {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  )
  const index = Math.abs(dayOfYear) % MOTIVATIONAL_QUOTES.length
  return MOTIVATIONAL_QUOTES[index]
}
