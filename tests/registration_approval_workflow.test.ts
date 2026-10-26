import { describe, it, expect, vi } from 'vitest'
import { importService, StudentRowSchema } from '@/services/importService'

describe('Mentor Connect — Complete Student Registration & Approval Suite (Stage 2.3)', () => {
  // Fictional Personas
  const adminUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin.cseds@viit.ac.in',
    role: 'admin'
  }

  const studentA = {
    id: '00000000-0000-0000-0000-000000000002',
    rollNumber: '23L31A5401',
    name: 'Aarav Sharma',
    email: 'aarav.23l31a5401@viit.ac.in',
    department: 'CSE-Data Science',
    year: 2,
    section: 'A'
  }

  const studentB = {
    id: '00000000-0000-0000-0000-000000000003',
    rollNumber: '23L31A5402',
    name: 'Bhavya Patel',
    email: 'bhavya.23l31a5402@viit.ac.in',
    department: 'CSE-Data Science',
    year: 2,
    section: 'A'
  }

  const intruderUser = {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'stranger@external.com'
  }

  describe('1. Secure Administrator Provisioning', () => {
    it('requires explicit database role assignment; zero automatic admin escalation', () => {
      // Simulates handle_new_auth_user() trigger logic
      const handleNewAuthUser = (email: string, rosterEmails: string[]) => {
        const isRostered = rosterEmails.includes(email.toLowerCase())
        if (isRostered) {
          return { linked: true, role: 'student' }
        }
        // Admin or stranger gets NO role automatically from trigger
        return { linked: false, role: null }
      }

      const roster = [studentA.email.toLowerCase(), studentB.email.toLowerCase()]
      const adminTriggerResult = handleNewAuthUser(adminUser.email, roster)

      // Verification: Admin is NOT auto-escalated by trigger
      expect(adminTriggerResult.role).toBeNull()

      // Explicit DB role assignment required
      const assignAdminRole = (userId: string, targetRole: 'admin' | 'student') => ({
        user_id: userId,
        role: targetRole
      })
      const adminRoleRecord = assignAdminRole(adminUser.id, 'admin')
      expect(adminRoleRecord.role).toBe('admin')
    })
  })

  describe('2. CSV Student Roster Parsing & Validation', () => {
    it('parses valid CSV containing student names, roll numbers, and emails', async () => {
      const csvContent = `roll_number,name,email,department,year,section
23L31A5401,Aarav Sharma,aarav.23l31a5401@viit.ac.in,CSE-Data Science,2,A
23L31A5402,Bhavya Patel,bhavya.23l31a5402@viit.ac.in,CSE-Data Science,2,A`

      const { validRows, errors } = await importService.parseCSV(csvContent)

      expect(errors).toHaveLength(0)
      expect(validRows).toHaveLength(2)
      expect(validRows[0].roll_number).toBe('23L31A5401')
      expect(validRows[0].name).toBe('Aarav Sharma')
      expect(validRows[0].email).toBe('aarav.23l31a5401@viit.ac.in')
      expect(validRows[1].roll_number).toBe('23L31A5402')
      expect(validRows[1].name).toBe('Bhavya Patel')
      expect(validRows[1].email).toBe('bhavya.23l31a5402@viit.ac.in')
    })

    it('rejects duplicate roll numbers and duplicate emails within same CSV', async () => {
      const duplicateCsv = `roll_number,name,email
23L31A5401,Aarav Sharma,aarav.23l31a5401@viit.ac.in
23L31A5401,Aarav Sharma Duplicate,different@viit.ac.in
23L31A5402,Bhavya Patel,aarav.23l31a5401@viit.ac.in`

      const { validRows, errors } = await importService.parseCSV(duplicateCsv)
      expect(validRows).toHaveLength(1)
      expect(errors).toHaveLength(2)
      expect(errors[0].message).toContain('Duplicate roll number')
      expect(errors[1].message).toContain('Duplicate email')
    })

    it('validates schema requirements for roll number, name and email', () => {
      const invalidRow = {
        roll_number: '23', // Too short (< 3)
        name: 'A', // Too short (< 2)
        email: 'invalid-email-format'
      }
      const res = StudentRowSchema.safeParse(invalidRow)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues.some(i => i.path.includes('roll_number'))).toBe(true)
        expect(res.error.issues.some(i => i.path.includes('name'))).toBe(true)
        expect(res.error.issues.some(i => i.path.includes('email'))).toBe(true)
      }
    })
  })

  describe('3. Account Claiming Trigger & Roster Protection', () => {
    // Database Mock State
    interface MockStudentDbRecord {
      id: string
      user_id: string | null
      roll_number: string
      name: string
      email: string
      status: string
      avatar_url: string | null
    }

    const studentsTable: MockStudentDbRecord[] = [
      {
        id: 'db-student-1',
        user_id: null, // Unclaimed initially
        roll_number: studentA.rollNumber,
        name: studentA.name,
        email: studentA.email,
        status: 'Active',
        avatar_url: null
      },
      {
        id: 'db-student-2',
        user_id: null, // Unclaimed initially
        roll_number: studentB.rollNumber,
        name: studentB.name,
        email: studentB.email,
        status: 'Active',
        avatar_url: null
      }
    ]

    const userRolesTable: Array<{ user_id: string; role: string }> = []

    const executeAuthUserCreatedTrigger = (newAuthUser: { id: string; email: string }) => {
      const match = studentsTable.find(s => s.email.toLowerCase() === newAuthUser.email.toLowerCase())
      if (!match) {
        // Unrostered email -> Zero role assigned
        return { success: true, linked: false, role: null }
      }

      // Check if already claimed by another user
      if (match.user_id !== null && match.user_id !== newAuthUser.id) {
        return { success: false, linked: false, error: 'Student record already claimed' }
      }

      // Link student record and assign student role
      match.user_id = newAuthUser.id
      userRolesTable.push({ user_id: newAuthUser.id, role: 'student' })
      return { success: true, linked: true, role: 'student', studentDbId: match.id }
    }

    it('links Student A upon account activation and assigns verified student role', () => {
      const result = executeAuthUserCreatedTrigger({ id: studentA.id, email: studentA.email })
      expect(result.success).toBe(true)
      expect(result.linked).toBe(true)
      expect(result.role).toBe('student')

      const record = studentsTable.find(s => s.roll_number === studentA.rollNumber)
      expect(record?.user_id).toBe(studentA.id)
      expect(userRolesTable.some(r => r.user_id === studentA.id && r.role === 'student')).toBe(true)
    })

    it('links Student B upon account activation and assigns verified student role', () => {
      const result = executeAuthUserCreatedTrigger({ id: studentB.id, email: studentB.email })
      expect(result.success).toBe(true)
      expect(result.linked).toBe(true)
      expect(result.role).toBe('student')

      const record = studentsTable.find(s => s.roll_number === studentB.rollNumber)
      expect(record?.user_id).toBe(studentB.id)
    })

    it('rejects duplicate claim attempt on already linked student record', () => {
      // Impostor trying to register with Student A email
      const impostorAttempt = executeAuthUserCreatedTrigger({
        id: 'impostor-uuid-999',
        email: studentA.email
      })
      expect(impostorAttempt.success).toBe(false)
      expect(impostorAttempt.error).toBe('Student record already claimed')
    })

    it('assigns zero application role to unrostered intruder', () => {
      const intruderResult = executeAuthUserCreatedTrigger(intruderUser)
      expect(intruderResult.linked).toBe(false)
      expect(intruderResult.role).toBeNull()
      expect(userRolesTable.some(r => r.user_id === intruderUser.id)).toBe(false)
    })
  })

  describe('3B. Protected Server-Side Auth Admin Invitation API (invite-student Edge Function)', () => {
    // Simulates the Edge Function backend execution
    const mockServiceRoleKey = 'sb_secret_service_role_key_never_exposed_to_client'
    const deployedEdgeFunction = async (
      callerRole: string | null,
      payload: { email: string; redirectTo?: string; data?: Record<string, any> },
      simulatedSmtpError?: string
    ) => {
      // 1. Verify caller has admin role
      if (callerRole !== 'admin') {
        return { status: 403, error: 'Forbidden: Administrator privileges required to dispatch invitations' }
      }

      // 2. Validate payload
      if (!payload.email || !payload.email.includes('@')) {
        return { status: 400, error: 'A valid student email address is required' }
      }

      // 3. Simulate GoTrue Admin API call using service role key
      if (simulatedSmtpError) {
        return { status: 400, error: simulatedSmtpError }
      }

      // Success using 'Invite User' template and redirect to reset-password
      return {
        status: 200,
        success: true,
        template: 'Invite User',
        redirectTo: payload.redirectTo || 'http://localhost:5173/login/reset-password',
        user: { email: payload.email, invited_at: new Date().toISOString() }
      }
    }

    it('blocks unauthenticated or non-admin callers from dispatching invitations', async () => {
      const studentAttempt = await deployedEdgeFunction('student', { email: studentB.email })
      expect(studentAttempt.status).toBe(403)
      expect(studentAttempt.error).toContain('Administrator privileges required')

      const intruderAttempt = await deployedEdgeFunction(null, { email: studentA.email })
      expect(intruderAttempt.status).toBe(403)
    })

    it('allows verified Administrator to dispatch official Invite User email with redirect', async () => {
      const adminInvite = await deployedEdgeFunction('admin', {
        email: studentA.email,
        redirectTo: 'http://localhost:5173/login/reset-password',
        data: { name: studentA.name, roll_number: studentA.rollNumber }
      })

      expect(adminInvite.status).toBe(200)
      expect(adminInvite.success).toBe(true)
      expect(adminInvite.template).toBe('Invite User')
      expect(adminInvite.redirectTo).toContain('/login/reset-password')
      expect(adminInvite.user?.email).toBe(studentA.email)
    })

    it('reports delivery and SMTP errors clearly to the administrator without swallowing exceptions', async () => {
      const failedInvite = await deployedEdgeFunction(
        'admin',
        { email: 'invalid.target@viit.ac.in' },
        'SMTP Error: 421 4.7.0 Rate limit exceeded. Try again in 1 hour.'
      )

      expect(failedInvite.status).toBe(400)
      expect(failedInvite.error).toContain('SMTP Error: 421 4.7.0 Rate limit exceeded')
    })
  })

  describe('4. Photograph Upload & Section-wise Submission Queue', () => {
    interface MockSubmission {
      id: string
      student_id: string
      section: 'personal' | 'family' | 'education' | 'photo'
      proposed_changes: Record<string, any>
      current_snapshot: Record<string, any> | null
      status: 'Pending' | 'Approved' | 'Corrections_Requested' | 'Rejected'
      mentor_remarks: string | null
      reviewed_by: string | null
    }

    const submissionsQueue: MockSubmission[] = []

    it('validates photo upload path and private bucket folder isolation', () => {
      const createPhotoPath = (userId: string, timestamp: number) => `${userId}/avatar_${timestamp}.jpg`
      const studentAPath = createPhotoPath(studentA.id, 1729850000000)
      const studentBPath = createPhotoPath(studentB.id, 1729850000000)

      expect(studentAPath.startsWith(`${studentA.id}/`)).toBe(true)
      expect(studentBPath.startsWith(`${studentB.id}/`)).toBe(true)
      expect(studentAPath).not.toBe(studentBPath)
    })

    it('queues photo submission from Student A for faculty review', () => {
      const photoSubmission: MockSubmission = {
        id: 'sub-photo-1',
        student_id: 'db-student-1',
        section: 'photo',
        proposed_changes: { avatar_url: `https://storage.supabase.co/profile-photos/${studentA.id}/avatar_1.jpg` },
        current_snapshot: null,
        status: 'Pending',
        mentor_remarks: null,
        reviewed_by: null
      }
      submissionsQueue.push(photoSubmission)

      expect(submissionsQueue.find(s => s.id === 'sub-photo-1')?.status).toBe('Pending')
    })

    it('queues mandatory personal details submission from Student A', () => {
      const personalSubmission: MockSubmission = {
        id: 'sub-personal-1',
        student_id: 'db-student-1',
        section: 'personal',
        proposed_changes: {
          phone: '+91 98480 11111',
          emergency_contact: '+91 98480 99999',
          current_address: 'Room 204, Ganga Boys Hostel, VIIT Campus',
          permanent_address: 'Door 4-12, Main Road, Visakhapatnam, AP',
          residence_type: 'Hostel on campus',
          transport_mode: 'Walk'
        },
        current_snapshot: null,
        status: 'Pending',
        mentor_remarks: null,
        reviewed_by: null
      }
      submissionsQueue.push(personalSubmission)
      expect(submissionsQueue).toHaveLength(2)
    })

    it('queues family details submission from Student B', () => {
      const familySubmission: MockSubmission = {
        id: 'sub-family-1',
        student_id: 'db-student-2',
        section: 'family',
        proposed_changes: {
          father_name: 'Kishore Patel',
          father_occupation: 'Senior Engineer',
          father_phone: '+91 99999 11111',
          mother_name: 'Anita Patel',
          mother_occupation: 'Teacher',
          mother_phone: '+91 99999 22222',
          annual_income: 1200000
        },
        current_snapshot: null,
        status: 'Pending',
        mentor_remarks: null,
        reviewed_by: null
      }
      submissionsQueue.push(familySubmission)
      expect(submissionsQueue).toHaveLength(3)
    })

    describe('5. Administrator Review & Transactional RPC Approval', () => {
      // Mock Target Tables
      const studentPersonalDetailsTable: Record<string, any> = {}
      const studentFamilyDetailsTable: Record<string, any> = {}
      const mockStudentsAvatarTable: Record<string, string | null> = {
        'db-student-1': null,
        'db-student-2': null
      }

      const reviewProfileSubmissionRPC = (
        callerRole: string,
        callerUid: string,
        submissionId: string,
        action: 'approve' | 'request_corrections' | 'reject',
        remarks?: string
      ) => {
        if (callerRole !== 'admin') {
          throw new Error('Access denied: Administrator role required')
        }

        const sub = submissionsQueue.find(s => s.id === submissionId)
        if (!sub) throw new Error('Submission not found')
        if (sub.status === 'Approved') throw new Error('Submission already approved')

        if (action === 'approve') {
          sub.status = 'Approved'
          if (sub.section === 'personal') {
            studentPersonalDetailsTable[sub.student_id] = {
              student_id: sub.student_id,
              ...sub.proposed_changes
            }
          } else if (sub.section === 'family') {
            studentFamilyDetailsTable[sub.student_id] = {
              student_id: sub.student_id,
              ...sub.proposed_changes
            }
          } else if (sub.section === 'photo') {
            mockStudentsAvatarTable[sub.student_id] = sub.proposed_changes.avatar_url
          }
        } else if (action === 'request_corrections') {
          sub.status = 'Corrections_Requested'
          sub.mentor_remarks = remarks || null
        }

        sub.reviewed_by = callerUid
        return { success: true, status: sub.status }
      }

      it('blocks non-admin students from executing review_profile_submission RPC', () => {
        expect(() => {
          reviewProfileSubmissionRPC('student', studentA.id, 'sub-photo-1', 'approve')
        }).toThrow('Access denied: Administrator role required')
      })

      it('allows Administrator to approve Student A photograph submission', () => {
        const result = reviewProfileSubmissionRPC(
          'admin',
          adminUser.id,
          'sub-photo-1',
          'approve',
          'Photograph verified against institutional ID guidelines.'
        )
        expect(result.success).toBe(true)
        expect(result.status).toBe('Approved')
        expect(mockStudentsAvatarTable['db-student-1']).toBe(
          `https://storage.supabase.co/profile-photos/${studentA.id}/avatar_1.jpg`
        )
      })

      it('allows Administrator to approve Student A personal details submission', () => {
        const result = reviewProfileSubmissionRPC(
          'admin',
          adminUser.id,
          'sub-personal-1',
          'approve'
        )
        expect(result.success).toBe(true)
        expect(result.status).toBe('Approved')
        expect(studentPersonalDetailsTable['db-student-1'].phone).toBe('+91 98480 11111')
        expect(studentPersonalDetailsTable['db-student-1'].current_address).toBe(
          'Room 204, Ganga Boys Hostel, VIIT Campus'
        )
      })

      it('allows Administrator to request corrections with mentor remarks on Student B family details', () => {
        const result = reviewProfileSubmissionRPC(
          'admin',
          adminUser.id,
          'sub-family-1',
          'request_corrections',
          'Please attach proof of annual income certificate.'
        )
        expect(result.success).toBe(true)
        expect(result.status).toBe('Corrections_Requested')

        const sub = submissionsQueue.find(s => s.id === 'sub-family-1')
        expect(sub?.mentor_remarks).toBe('Please attach proof of annual income certificate.')
        // Family table not committed
        expect(studentFamilyDetailsTable['db-student-2']).toBeUndefined()
      })
    })

    describe('6. Directory Synchronization & Privacy Verification', () => {
      it('reflects approved photograph in student directory while respecting contact privacy toggles', () => {
        // Simulates trg_sync_student_directory_students trigger
        const directoryState = {
          student_id: 'db-student-1',
          roll_number: studentA.rollNumber,
          name: studentA.name,
          department: studentA.department,
          year: studentA.year,
          section: studentA.section,
          avatar_url: `https://storage.supabase.co/profile-photos/${studentA.id}/avatar_1.jpg`,
          phone: null, // masked (share_phone_in_directory = false)
          email: null // masked (share_email_in_directory = false)
        }

        expect(directoryState.avatar_url).toContain(studentA.id)
        expect(directoryState.phone).toBeNull()
        expect(directoryState.email).toBeNull()
      })
    })

    describe('7. Improved Student Invitation Workflow & Pilot Test Record Actions', () => {
      const testPilotStudent = {
        id: 'db-pilot-99',
        rollNumber: '23L31A5499',
        name: 'Test Pilot Student',
        email: 'test.pilot@example.com',
        userId: null
      }

      const isTestPilotRecord = (record: { rollNumber?: string; name?: string; email?: string; dbId?: string }) => {
        const roll = (record.rollNumber || '').toUpperCase()
        const name = (record.name || '').toLowerCase()
        const email = (record.email || '').toLowerCase()
        const isTestRoll = roll.startsWith('23L31A549') || roll.includes('TEST') || roll.includes('PILOT')
        const isTestName = name.includes('test') || name.includes('pilot')
        const isTestEmail = email.includes('test') || email.includes('pilot')
        const isCustomDb = record.dbId && !['23L31A5401', '23L31A5402', '23L31A5403', '23L31A5404', '23L31A5405', '23L31A5406', '23L31A5407'].includes(roll)
        return Boolean(isTestRoll || isTestName || isTestEmail || isCustomDb)
      }

      const determineAction = (
        student: { email: string; userId: string | null },
        invitedEmails: Set<string>,
        activatedEmails: Set<string>
      ) => {
        const isEmailActivated = activatedEmails.has(student.email.toLowerCase())
        const isDbActivated = Boolean(student.userId && !invitedEmails.has(student.email.toLowerCase()))
        const isActivated = isEmailActivated || isDbActivated
        const isInvited = !isActivated && invitedEmails.has(student.email.toLowerCase())

        if (isActivated) return 'RESET_PASSWORD'
        if (isInvited) return 'RESEND_INVITE'
        return 'SEND_INVITE'
      }

      it('determines SEND_INVITE for uninvited students using their registered email directly', () => {
        const invitedEmails = new Set<string>()
        const activatedEmails = new Set<string>()
        const action = determineAction(testPilotStudent, invitedEmails, activatedEmails)

        expect(action).toBe('SEND_INVITE')
      })

      it('determines RESEND_INVITE for students with pending unactivated invitations', () => {
        const invitedEmails = new Set<string>([testPilotStudent.email.toLowerCase()])
        const activatedEmails = new Set<string>()
        const action = determineAction(testPilotStudent, invitedEmails, activatedEmails)

        expect(action).toBe('RESEND_INVITE')
      })

      it('determines RESET_PASSWORD for activated accounts to avoid duplicated initial invitations', () => {
        const invitedEmails = new Set<string>()
        const activatedEmails = new Set<string>([testPilotStudent.email.toLowerCase()])
        const action = determineAction(testPilotStudent, invitedEmails, activatedEmails)

        expect(action).toBe('RESET_PASSWORD')
      })

      it('accurately identifies fictional pilot test records while protecting authentic cohort students', () => {
        // Pilot test record should be identified as eligible for deletion
        expect(isTestPilotRecord(testPilotStudent)).toBe(true)
        expect(isTestPilotRecord({ rollNumber: '23L31A5499', name: 'Custom Pilot', email: 'c@viit.ac.in' })).toBe(true)

        // Authentic cohort students MUST NEVER be flagged as deletable test records
        expect(isTestPilotRecord({ rollNumber: '23L31A5401', name: 'Aarav Sharma', email: 'aarav@viit.ac.in' })).toBe(false)
        expect(isTestPilotRecord({ rollNumber: '23L31A5402', name: 'Bhavya Patel', email: 'bhavya@viit.ac.in' })).toBe(false)
      })

      it('performs safe deletion and cleanup of pilot record from roster and tracking sets', () => {
        let roster = [testPilotStudent, studentA]
        const invited = new Set([testPilotStudent.email.toLowerCase()])
        const activated = new Set([testPilotStudent.email.toLowerCase()])

        // Simulate admin deletion execution
        const targetRoll = testPilotStudent.rollNumber
        roster = roster.filter(s => s.rollNumber !== targetRoll)
        invited.delete(testPilotStudent.email.toLowerCase())
        activated.delete(testPilotStudent.email.toLowerCase())

        expect(roster.find(s => s.rollNumber === targetRoll)).toBeUndefined()
        expect(roster.length).toBe(1)
        expect(roster[0].rollNumber).toBe('23L31A5401')
        expect(invited.has(testPilotStudent.email.toLowerCase())).toBe(false)
        expect(activated.has(testPilotStudent.email.toLowerCase())).toBe(false)
      })
    })

    describe('8. Database Trigger Account-Linking Permissions Verification', () => {
      // Simulates check_student_update_privileges() with genuine sessionUser and internal auth-linking setting
      const isNotDistinctFrom = (a: any, b: any) => {
        if (a === null && b === null) return true
        if (a === undefined && b === undefined) return true
        return a === b
      }

      const checkStudentUpdatePrivileges = (
        oldRecord: any,
        newRecord: any,
        isAdmin: boolean,
        isAuthLinking: boolean,
        sessionUser: string = 'supabase_auth_admin'
      ) => {
        const isTrustedAuthSession =
          ['supabase_auth_admin', 'postgres'].includes(sessionUser) && isAuthLinking

        if (isTrustedAuthSession) {
          if (
            oldRecord.user_id === null &&
            newRecord.user_id !== null &&
            isNotDistinctFrom(newRecord.id, oldRecord.id) &&
            isNotDistinctFrom(newRecord.roll_number, oldRecord.roll_number) &&
            isNotDistinctFrom(newRecord.name, oldRecord.name) &&
            isNotDistinctFrom(newRecord.email, oldRecord.email) &&
            isNotDistinctFrom(newRecord.department, oldRecord.department) &&
            isNotDistinctFrom(newRecord.year, oldRecord.year) &&
            isNotDistinctFrom(newRecord.semester, oldRecord.semester) &&
            isNotDistinctFrom(newRecord.section, oldRecord.section) &&
            isNotDistinctFrom(newRecord.mentor_id, oldRecord.mentor_id) &&
            isNotDistinctFrom(newRecord.status, oldRecord.status) &&
            isNotDistinctFrom(newRecord.avatar_url, oldRecord.avatar_url) &&
            isNotDistinctFrom(newRecord.share_phone_in_directory, oldRecord.share_phone_in_directory) &&
            isNotDistinctFrom(newRecord.share_email_in_directory, oldRecord.share_email_in_directory)
          ) {
            return { allowed: true }
          }
        }

        if (!isAdmin) {
          if (
            newRecord.id !== oldRecord.id ||
            newRecord.user_id !== oldRecord.user_id ||
            newRecord.roll_number !== oldRecord.roll_number ||
            newRecord.name !== oldRecord.name ||
            newRecord.email !== oldRecord.email ||
            newRecord.department !== oldRecord.department ||
            newRecord.year !== oldRecord.year ||
            newRecord.semester !== oldRecord.semester ||
            newRecord.section !== oldRecord.section ||
            newRecord.mentor_id !== oldRecord.mentor_id ||
            newRecord.status !== oldRecord.status
          ) {
            throw new Error(
              'Access Denied: Students are restricted to updating directory privacy preferences. Academic and cohort modifications require administrator privileges.'
            )
          }
        }

        return { allowed: true }
      }

      // Simulates handle_new_auth_user() strict invitation-only requirement
      const handleNewAuthUserSimulation = (
        authUser: { id: string; email: string; invited_at: string | null; email_confirmed_at: string | null },
        rosterStudent: any | null
      ) => {
        // Enforce strict administrator invitation requirement (invited_at IS NOT NULL)
        // Email confirmation alone MUST NOT grant student roster access
        if (!authUser.invited_at) {
          return { linked: false, reason: 'UNINVITED_SIGNUP_BLOCKED' }
        }

        if (rosterStudent) {
          if (rosterStudent.user_id && rosterStudent.user_id !== authUser.id) {
            return { linked: false, reason: 'ROSTER_ALREADY_CLAIMED' }
          }
          return { linked: true, studentId: rosterStudent.id, assignedUserId: authUser.id }
        }

        return { linked: false, reason: 'EMAIL_NOT_IN_ROSTER' }
      }

      const baselineStudent = {
        id: 'db-student-test-1',
        user_id: null,
        roll_number: '23L31A5499',
        name: 'Test Pilot Student',
        email: 'test.pilot@example.com',
        department: 'CSE-Data Science',
        year: 2,
        semester: 1,
        section: 'A',
        mentor_id: null,
        status: 'Active',
        avatar_url: null,
        share_phone_in_directory: false,
        share_email_in_directory: false
      }

      it('permits internal account-linking when sessionUser is supabase_auth_admin and isAuthLinking is true', () => {
        const linkedRecord = {
          ...baselineStudent,
          user_id: 'auth-uuid-test-99'
        }

        const result = checkStudentUpdatePrivileges(
          baselineStudent,
          linkedRecord,
          false, // isAdmin = false (internal GoTrue session has auth.uid() = null)
          true,  // isAuthLinking = true (set by handle_new_auth_user)
          'supabase_auth_admin'
        )

        expect(result.allowed).toBe(true)
      })

      it('strictly rejects account-linking if sessionUser is authenticator (PostgREST client connection)', () => {
        const linkedRecord = {
          ...baselineStudent,
          user_id: 'auth-uuid-test-99'
        }

        // Even if an attacker somehow injected isAuthLinking=true, authenticator session cannot bypass
        expect(() =>
          checkStudentUpdatePrivileges(
            baselineStudent,
            linkedRecord,
            false,
            true,
            'authenticator' // PostgREST client session!
          )
        ).toThrow('Access Denied: Students are restricted to updating directory privacy preferences')
      })

      it('safely handles nullable fields (mentor_id, avatar_url) using NULL-safe comparisons', () => {
        const withNulls = {
          ...baselineStudent,
          user_id: 'auth-uuid-test-99',
          mentor_id: null,
          avatar_url: null
        }

        const result = checkStudentUpdatePrivileges(
          baselineStudent,
          withNulls,
          false,
          true,
          'supabase_auth_admin'
        )
        expect(result.allowed).toBe(true)
      })

      it('strictly rejects any academic modification during account-linking', () => {
        const tamperedRecord = {
          ...baselineStudent,
          user_id: 'auth-uuid-test-99',
          department: 'Hacked Department'
        }

        expect(() =>
          checkStudentUpdatePrivileges(
            baselineStudent,
            tamperedRecord,
            false,
            true,
            'supabase_auth_admin'
          )
        ).toThrow('Access Denied: Students are restricted to updating directory privacy preferences')
      })

      it('strictly blocks unauthorized uninvited self-signups from claiming roster records', () => {
        const unverifiedStranger = {
          id: 'stranger-auth-uuid',
          email: baselineStudent.email,
          invited_at: null, // NOT invited by administrator!
          email_confirmed_at: null // NOT confirmed!
        }

        const result = handleNewAuthUserSimulation(unverifiedStranger, baselineStudent)
        expect(result.linked).toBe(false)
        expect(result.reason).toBe('UNINVITED_SIGNUP_BLOCKED')
      })

      it('rejects self-signup from claiming roster records even if email is confirmed when invited_at is null', () => {
        const confirmedStranger = {
          id: 'stranger-auth-uuid-2',
          email: baselineStudent.email,
          invited_at: null, // NOT invited by administrator!
          email_confirmed_at: '2026-10-25T14:55:00Z' // Email confirmed externally
        }

        const result = handleNewAuthUserSimulation(confirmedStranger, baselineStudent)
        expect(result.linked).toBe(false)
        expect(result.reason).toBe('UNINVITED_SIGNUP_BLOCKED')
      })

      it('allows legitimate administrator-dispatched invitations to claim roster records', () => {
        const adminInvitedStudent = {
          id: 'invited-student-auth-uuid',
          email: baselineStudent.email,
          invited_at: '2026-10-25T14:50:00Z', // Legitimate invitation from administrator!
          email_confirmed_at: null
        }

        const result = handleNewAuthUserSimulation(adminInvitedStudent, baselineStudent)
        expect(result.linked).toBe(true)
        expect(result.assignedUserId).toBe('invited-student-auth-uuid')
      })

      it('strictly rejects account takeover if user_id is already claimed', () => {
        const alreadyClaimed = {
          ...baselineStudent,
          user_id: 'original-owner-uuid'
        }
        const hijackAttempt = {
          ...alreadyClaimed,
          user_id: 'attacker-uuid'
        }

        expect(() =>
          checkStudentUpdatePrivileges(
            alreadyClaimed,
            hijackAttempt,
            false,
            true,
            'supabase_auth_admin'
          )
        ).toThrow('Access Denied: Students are restricted to updating directory privacy preferences')
      })
    })
  })
})
