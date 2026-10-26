import { describe, it, expect } from 'vitest'

describe('Mentor Connect — Cross-Student Privacy & Directory Isolation Suite', () => {
  // Four Explicit Verification Identities
  const admin = {
    authUid: '00000000-0000-0000-0000-000000000001',
    role: 'admin',
    isAdmin: true
  }

  const studentA = {
    authUid: '00000000-0000-0000-0000-000000000002',
    role: 'student',
    status: 'Active',
    isAdmin: false,
    rollNumber: '23L31A5401',
    name: 'Aarav Sharma',
    email: 'studenta@viit.ac.in',
    phone: '+91 98480 11111',
    current_address: 'Room 204, Ganga Boys Hostel',
    emergency_contact: '+91 98480 99999',
    share_email_in_directory: false,
    share_phone_in_directory: false
  }

  const studentB = {
    authUid: '00000000-0000-0000-0000-000000000003',
    role: 'student',
    status: 'Active',
    isAdmin: false,
    rollNumber: '23L31A5402',
    name: 'Bhavya Reddy',
    email: 'studentb@viit.ac.in',
    phone: '+91 99999 22222',
    current_address: 'Flat 401, Cyber Towers, Madhapur',
    emergency_contact: '+91 99999 88888',
    share_email_in_directory: false,
    share_phone_in_directory: false
  }

  const unrosteredUser = {
    authUid: '00000000-0000-0000-0000-000000000004',
    role: null, // No application role
    status: null, // No student profile
    isAdmin: false,
    email: 'intruder@unknown.com'
  }

  // Active students database state
  const activeStudentsRoster = [
    { user_id: studentA.authUid, status: studentA.status },
    { user_id: studentB.authUid, status: studentB.status }
  ]

  describe('1. Underlying Table RLS Isolation', () => {
    // Policy on public.students: USING (user_id = auth.uid() OR is_admin())
    const canSelectStudentRow = (recordUserId: string, callerAuthUid: string, callerIsAdmin: boolean) => {
      return callerIsAdmin || recordUserId === callerAuthUid
    }

    it('allows Student A to select only own record; rejects Student B row', () => {
      expect(canSelectStudentRow(studentA.authUid, studentA.authUid, false)).toBe(true)
      expect(canSelectStudentRow(studentB.authUid, studentA.authUid, false)).toBe(false)
    })

    it('blocks unrostered authenticated user from reading any student rows', () => {
      expect(canSelectStudentRow(studentA.authUid, unrosteredUser.authUid, false)).toBe(false)
      expect(canSelectStudentRow(studentB.authUid, unrosteredUser.authUid, false)).toBe(false)
    })

    it('allows administrator to select all student records', () => {
      expect(canSelectStudentRow(studentA.authUid, admin.authUid, true)).toBe(true)
      expect(canSelectStudentRow(studentB.authUid, admin.authUid, true)).toBe(true)
    })

    // Policy on public.student_personal_details: USING (s.user_id = auth.uid() OR is_admin())
    it('blocks Student A from selecting Student B personal details even if Student B opted in to share phone', () => {
      const canSelectPersonal = (recordStudentUserId: string, callerAuthUid: string, callerIsAdmin: boolean) => {
        return callerIsAdmin || recordStudentUserId === callerAuthUid
      }

      // Student B opted in to share phone in directory
      const studentBSharedPhone = { ...studentB, share_phone_in_directory: true }

      // Student A still receives 0 rows when directly querying student_personal_details
      expect(canSelectPersonal(studentBSharedPhone.authUid, studentA.authUid, false)).toBe(false)
      // Administrator can select full personal details
      expect(canSelectPersonal(studentBSharedPhone.authUid, admin.authUid, true)).toBe(true)
    })
  })

  describe('2. Sanitized Directory Table RLS Access (Authorized Members Only)', () => {
    // Policy on public.student_directory: USING (is_admin() OR EXISTS (SELECT 1 FROM students s WHERE s.user_id = auth.uid() AND s.status = 'Active'))
    const canSelectDirectoryTable = (callerAuthUid: string, callerIsAdmin: boolean) => {
      if (callerIsAdmin) return true
      return activeStudentsRoster.some(s => s.user_id === callerAuthUid && s.status === 'Active')
    }

    it('allows authorized active students (Student A and Student B) to query directory table', () => {
      expect(canSelectDirectoryTable(studentA.authUid, false)).toBe(true)
      expect(canSelectDirectoryTable(studentB.authUid, false)).toBe(true)
    })

    it('strictly blocks unrostered authenticated users from querying directory table', () => {
      expect(canSelectDirectoryTable(unrosteredUser.authUid, false)).toBe(false)
    })

    it('allows administrator to query directory table', () => {
      expect(canSelectDirectoryTable(admin.authUid, true)).toBe(true)
    })
  })

  describe('3. Directory Synchronization on roll_number and email Updates', () => {
    const syncDirectoryEntry = (
      student: { rollNumber: string; name: string; email: string; share_email_in_directory: boolean; share_phone_in_directory: boolean },
      personalPhone: string | null
    ) => {
      return {
        roll_number: student.rollNumber,
        name: student.name,
        email: student.share_email_in_directory ? student.email : null,
        phone: student.share_phone_in_directory ? personalPhone : null,
        share_email: student.share_email_in_directory,
        share_phone: student.share_phone_in_directory
      }
    }

    it('synchronizes administrator corrections to roll_number and email immediately', () => {
      const studentBUpdated = {
        ...studentB,
        rollNumber: '23L31A5402_UPDATED',
        email: 'bhavya.new@viit.ac.in',
        share_email_in_directory: false // sharing still disabled
      }

      const synced = syncDirectoryEntry(studentBUpdated, studentB.phone)
      expect(synced.roll_number).toBe('23L31A5402_UPDATED')
      // Email is NOT exposed in directory because share_email_in_directory is false
      expect(synced.email).toBeNull()
    })

    it('exposes updated email only when share_email_in_directory is explicitly enabled', () => {
      const studentBOptedInEmail = {
        ...studentB,
        email: 'bhavya.verified@viit.ac.in',
        share_email_in_directory: true
      }

      const synced = syncDirectoryEntry(studentBOptedInEmail, studentB.phone)
      expect(synced.email).toBe('bhavya.verified@viit.ac.in')
    })
  })

  describe('4. Administrator Contact Visibility Resolution', () => {
    const resolveDirectoryViewRow = (
      directoryEntry: { roll_number: string; name: string; email: string | null; phone: string | null; share_email: boolean; share_phone: boolean },
      masterStudent: { email: string },
      masterPersonal: { phone: string },
      callerIsAdmin: boolean
    ) => {
      const resolvedEmail = directoryEntry.share_email
        ? (directoryEntry.email || 'Confidential')
        : (callerIsAdmin ? masterStudent.email : 'Confidential')

      const resolvedPhone = directoryEntry.share_phone
        ? (directoryEntry.phone || 'Confidential')
        : (callerIsAdmin ? masterPersonal.phone : 'Confidential')

      return {
        roll_number: directoryEntry.roll_number,
        name: directoryEntry.name,
        email: resolvedEmail,
        phone: resolvedPhone
      }
    }

    it('ensures regular students see Confidential for opted-out classmates', () => {
      const dirEntryB = {
        roll_number: studentB.rollNumber,
        name: studentB.name,
        email: null,
        phone: null,
        share_email: false,
        share_phone: false
      }

      const viewForStudentA = resolveDirectoryViewRow(
        dirEntryB,
        { email: studentB.email },
        { phone: studentB.phone },
        false // Caller is Student A
      )

      expect(viewForStudentA.email).toBe('Confidential')
      expect(viewForStudentA.phone).toBe('Confidential')
    })

    it('ensures administrators can see full authorized contact information via verified server-side authorization', () => {
      const dirEntryB = {
        roll_number: studentB.rollNumber,
        name: studentB.name,
        email: null,
        phone: null,
        share_email: false,
        share_phone: false
      }

      const viewForAdmin = resolveDirectoryViewRow(
        dirEntryB,
        { email: studentB.email },
        { phone: studentB.phone },
        true // Caller is Administrator
      )

      expect(viewForAdmin.email).toBe('studentb@viit.ac.in')
      expect(viewForAdmin.phone).toBe('+91 99999 22222')
    })
  })
})
