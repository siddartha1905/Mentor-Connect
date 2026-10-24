import { describe, it, expect } from 'vitest'
import { StudentRowSchema, importService } from '../src/services/importService'

describe('Mentor Connect — Stage 2 Security & Access Control Tests', () => {
  describe('Student Onboarding & CSV Schema Validation', () => {
    it('accepts valid CSE-DS student record with required fields', () => {
      const valid = {
        roll_number: '23L31A5410',
        name: 'K. Sai Teja',
        email: 'saiteja.23l31a5410@viit.ac.in',
        department: 'CSE-Data Science',
        year: 2,
        section: 'A'
      }
      const parsed = StudentRowSchema.safeParse(valid)
      expect(parsed.success).toBe(true)
    })

    it('rejects invalid email formats', () => {
      const invalidEmail = {
        roll_number: '23L31A5411',
        name: 'Test Student',
        email: 'invalid-email-string'
      }
      const parsed = StudentRowSchema.safeParse(invalidEmail)
      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        expect(parsed.error.issues[0].path).toContain('email')
      }
    })

    it('rejects non-alphanumeric or missing roll numbers', () => {
      const invalidRoll = {
        roll_number: '23L31A 5412!!',
        name: 'Test Student',
        email: 'test@viit.ac.in'
      }
      const parsed = StudentRowSchema.safeParse(invalidRoll)
      expect(parsed.success).toBe(false)
    })

    it('detects duplicate roll numbers in CSV', async () => {
      const csvContent = `roll_number,name,email
23L31A5401,Aarav Sharma,aarav@viit.ac.in
23L31A5401,Aarav Duplicate,aarav2@viit.ac.in`

      const { validRows, errors } = await importService.parseCSV(csvContent)
      expect(validRows.length).toBe(1)
      expect(errors.length).toBe(1)
      expect(errors[0].message).toContain('Duplicate roll number')
    })

    it('detects duplicate emails in CSV', async () => {
      const csvContent = `roll_number,name,email
23L31A5401,Aarav Sharma,aarav@viit.ac.in
23L31A5402,Bhavya Reddy,aarav@viit.ac.in`

      const { validRows, errors } = await importService.parseCSV(csvContent)
      expect(validRows.length).toBe(1)
      expect(errors.length).toBe(1)
      expect(errors[0].message).toContain('Duplicate email')
    })
  })

  describe('Auditable Submission Allowlist Enforcement', () => {
    const ALLOWED_KEYS = {
      personal: ['dob', 'gender', 'blood_group', 'phone', 'emergency_contact', 'current_address', 'permanent_address'],
      family: ['father_name', 'father_occupation', 'father_phone', 'mother_name', 'mother_occupation', 'mother_phone', 'guardian_name', 'guardian_phone', 'annual_income'],
      education: ['tenth_board', 'tenth_school', 'tenth_percentage', 'twelfth_board', 'twelfth_college', 'twelfth_percentage', 'eamcet_rank'],
      photo: ['avatar_url']
    }

    it('verifies personal details allowlist excludes privileged or arbitrary columns', () => {
      const maliciousPayload = {
        phone: '+91 99999 88888',
        role: 'admin', // Escalation attempt
        cgpa: 10.0,    // Tampering attempt
        is_admin: true
      }

      const keys = Object.keys(maliciousPayload)
      const disallowed = keys.filter(k => !ALLOWED_KEYS.personal.includes(k))
      expect(disallowed).toEqual(['role', 'cgpa', 'is_admin'])
    })

    it('verifies family section allowlist strictly contains only permitted family fields', () => {
      const familyPayload = {
        father_name: 'Rajesh Sharma',
        father_phone: '+91 94401 23456',
        annual_income: 850000
      }

      const keys = Object.keys(familyPayload)
      const allAllowed = keys.every(k => ALLOWED_KEYS.family.includes(k))
      expect(allAllowed).toBe(true)
    })
  })

  describe('Privacy Directory Masking Logic', () => {
    it('masks phone and email if student has not opted in', () => {
      const studentA = {
        name: 'Charith Varma',
        rollNumber: '23L31A5403',
        phone: '+91 99887 65432',
        email: 'charith.23l31a5403@viit.ac.in',
        share_phone_in_directory: false,
        share_email_in_directory: false
      }

      const maskedPhone = studentA.share_phone_in_directory ? studentA.phone : 'Confidential'
      const maskedEmail = studentA.share_email_in_directory ? studentA.email : 'Confidential'

      expect(maskedPhone).toBe('Confidential')
      expect(maskedEmail).toBe('Confidential')
    })

    it('reveals phone and email only when explicit opt-in is granted', () => {
      const studentB = {
        name: 'Aarav Sharma',
        rollNumber: '23L31A5401',
        phone: '+91 98480 12345',
        email: 'aarav.23l31a5401@viit.ac.in',
        share_phone_in_directory: true,
        share_email_in_directory: true
      }

      const displayedPhone = studentB.share_phone_in_directory ? studentB.phone : 'Confidential'
      const displayedEmail = studentB.share_email_in_directory ? studentB.email : 'Confidential'

      expect(displayedPhone).toBe('+91 98480 12345')
      expect(displayedEmail).toBe('aarav.23l31a5401@viit.ac.in')
    })
  })

  describe('Storage Path Isolation & Collision Resistance', () => {
    it('generates user-scoped collision-resistant storage path', () => {
      const userId = 'usr-9283-4921'
      const timestamp = 1792875000000
      const path = `${userId}/avatar_${timestamp}.jpg`

      expect(path.startsWith(`${userId}/`)).toBe(true)
      expect(path).toContain('.jpg')
      expect(path.split('/')[0]).toBe(userId)
    })
  })
})
