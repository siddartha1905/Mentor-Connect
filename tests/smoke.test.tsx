import { describe, it, expect } from 'vitest'
import { MOCK_STUDENTS, MOCK_ATTENDANCE, INITIAL_APPROVALS, getDailyQuote } from '../src/data/mock'

describe('Mentor Connect — Stage 1 Smoke Tests', () => {
  it('loads fictional student dataset properly with 7 representative students', () => {
    expect(MOCK_STUDENTS.length).toBe(7)
    
    // Check specific roll numbers and departments
    MOCK_STUDENTS.forEach((student) => {
      expect(student.rollNumber).toMatch(/^23L31A540[1-7]$/)
      expect(student.department).toBe('CSE-Data Science')
      expect(student.currentSemester).toBe('2-1')
      expect(student.academics.subjects.length).toBeGreaterThanOrEqual(5)
    })
  })

  it('rotates daily quote deterministically without runtime errors', () => {
    const dailyQuote = getDailyQuote()
    expect(dailyQuote).toBeDefined()
    expect(dailyQuote.quote.length).toBeGreaterThan(10)
    expect(dailyQuote.author.length).toBeGreaterThan(3)
  })

  it('validates attendance profiles with warning and critical thresholds', () => {
    const aaravAttendance = MOCK_ATTENDANCE['23L31A5401']
    expect(aaravAttendance.officialPercentage).toBe(88.5)
    expect(aaravAttendance.health).toBe('Good')

    const chiragAttendance = MOCK_ATTENDANCE['23L31A5403']
    expect(chiragAttendance.officialPercentage).toBeLessThan(80)
    expect(chiragAttendance.health).toBe('Warning')

    const divyaAttendance = MOCK_ATTENDANCE['23L31A5404']
    expect(divyaAttendance.officialPercentage).toBeLessThan(75)
    expect(divyaAttendance.health).toBe('Critical')
  })

  it('validates approval centre queue entries with old and proposed diffs', () => {
    expect(INITIAL_APPROVALS.length).toBeGreaterThanOrEqual(4)
    INITIAL_APPROVALS.forEach((item) => {
      expect(item.studentRollNumber).toBeDefined()
      expect(item.sectionName).toBeDefined()
      expect(Object.keys(item.proposedValues).length).toBeGreaterThan(0)
    })
  })
})
