import Papa from 'papaparse'
import { z } from 'zod'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const StudentRowSchema = z.object({
  roll_number: z
    .string()
    .min(3, 'Roll number is required')
    .regex(/^[A-Za-z0-9]+$/, 'Roll number must be alphanumeric'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  department: z.string().default('CSE-Data Science'),
  year: z.coerce.number().min(1).max(4).default(2),
  semester: z.coerce.number().min(1).max(2).default(1),
  section: z.string().default('A'),
  phone: z.string().optional(),
  father_name: z.string().optional(),
  father_phone: z.string().optional()
})

export type ValidatedStudentRow = z.infer<typeof StudentRowSchema>

export interface ImportRowError {
  row: number
  rollNumber?: string
  message: string
}

export interface RosterStudentAnalysis {
  row: ValidatedStudentRow
  status: 'new' | 'existing' | 'conflict'
  message?: string
}

export interface RosterAnalysisResult {
  totalRows: number
  validRows: ValidatedStudentRow[]
  newRows: ValidatedStudentRow[]
  existingRows: ValidatedStudentRow[]
  conflicts: ImportRowError[]
  analyzedStudents: RosterStudentAnalysis[]
}

export interface ImportResult {
  totalRows: number
  validCount: number
  insertedCount: number
  skippedExistingCount: number
  errors: ImportRowError[]
}

export const importService = {
  // Generate official downloadable CSV roster template
  getSampleCSVTemplate(): string {
    return [
      'roll_number,name,email,department,year,semester,section,phone,father_name,father_phone',
      '23L31A5401,Aditya Verma,aditya.verma@vignaniit.edu.in,CSE-Data Science,2,1,A,9876543210,K. Verma,9876543211',
      '23L31A5402,Bhavya Sri,bhavya.sri@vignaniit.edu.in,CSE-Data Science,2,1,A,9876543212,M. Rao,9876543213'
    ].join('\n')
  },

  // Trigger direct browser download of the clean CSV template
  downloadCSVTemplate(): void {
    const csvContent = this.getSampleCSVTemplate()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'mentor_connect_roster_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  // Parse and validate CSV file contents or string
  async parseCSV(input: File | string): Promise<{
    validRows: ValidatedStudentRow[]
    errors: ImportRowError[]
  }> {
    const csvString = typeof input === 'string' ? input : await input.text()

    return new Promise((resolve) => {
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header) => header.trim().toLowerCase().replace(/[\s_-]+/g, '_'),
        complete: (results) => {
          const validRows: ValidatedStudentRow[] = []
          const errors: ImportRowError[] = []
          const seenRolls = new Set<string>()
          const seenEmails = new Set<string>();

          (results.data as Array<Record<string, unknown>>).forEach((rawRow: Record<string, unknown>, index: number) => {
            const rowNumber = index + 2 // +2 accounts for 1-based index and CSV header row

            // Pre-process fields and normalize headers
            const rollRaw = String(rawRow.roll_number || rawRow.roll_no || rawRow.rollno || rawRow.htno || '').trim()
            const nameRaw = String(rawRow.name || rawRow.student_name || rawRow.full_name || '').trim()
            const emailRaw = String(rawRow.email || rawRow.student_email || '').trim().toLowerCase()
            const deptRaw = String(rawRow.department || rawRow.branch || rawRow.dept || 'CSE-Data Science').trim()
            const yearRaw = Number(rawRow.year) || 2
            const semRaw = Number(rawRow.semester || rawRow.sem) || 1
            const secRaw = String(rawRow.section || rawRow.sec || 'A').trim().toUpperCase()
            const phoneRaw = String(rawRow.phone || rawRow.mobile || '').trim()
            const fatherRaw = String(rawRow.father_name || rawRow.parent_name || '').trim()
            const fatherPhoneRaw = String(rawRow.father_phone || rawRow.parent_phone || '').trim()

            const normalized = {
              roll_number: rollRaw,
              name: nameRaw,
              email: emailRaw,
              department: deptRaw,
              year: yearRaw,
              semester: semRaw,
              section: secRaw,
              phone: phoneRaw || undefined,
              father_name: fatherRaw || undefined,
              father_phone: fatherPhoneRaw || undefined
            }

            const parseResult = StudentRowSchema.safeParse(normalized)
            if (!parseResult.success) {
              const msg = parseResult.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')
              errors.push({
                row: rowNumber,
                rollNumber: normalized.roll_number || undefined,
                message: msg
              })
              return
            }

            const item = parseResult.data
            const rollKey = item.roll_number.toUpperCase()
            const emailKey = item.email.toLowerCase()

            // Check duplicate in same CSV
            if (seenRolls.has(rollKey)) {
              errors.push({
                row: rowNumber,
                rollNumber: item.roll_number,
                message: `Duplicate roll number ${item.roll_number} found in CSV file`
              })
              return
            }
            if (seenEmails.has(emailKey)) {
              errors.push({
                row: rowNumber,
                rollNumber: item.roll_number,
                message: `Duplicate email ${item.email} found in CSV file`
              })
              return
            }

            seenRolls.add(rollKey)
            seenEmails.add(emailKey)
            validRows.push(item)
          })

          resolve({ validRows, errors })
        },
        error: (err: Error) => {
          resolve({
            validRows: [],
            errors: [{ row: 1, message: `CSV Parsing error: ${err.message}` }]
          })
        }
      })
    })
  },

  // Analyze parsed rows against Supabase students to provide accurate preview counts
  async analyzeRosterAgainstDatabase(rows: ValidatedStudentRow[]): Promise<RosterAnalysisResult> {
    if (rows.length === 0) {
      return {
        totalRows: 0,
        validRows: [],
        newRows: [],
        existingRows: [],
        conflicts: [],
        analyzedStudents: []
      }
    }

    if (!isSupabaseConfigured()) {
      return {
        totalRows: rows.length,
        validRows: rows,
        newRows: rows,
        existingRows: [],
        conflicts: [],
        analyzedStudents: rows.map(r => ({ row: r, status: 'new' }))
      }
    }

    const rollNumbers = rows.map(r => r.roll_number.toUpperCase())
    const emails = rows.map(r => r.email.toLowerCase())

    const { data: existingStudents, error: fetchError } = await supabase
      .from('students')
      .select('id, roll_number, email, user_id, name')
      .or(`roll_number.in.(${rollNumbers.join(',')}),email.in.(${emails.join(',')})`)

    if (fetchError) {
      console.warn('Could not query existing students during CSV preview:', fetchError.message)
    }

    const dbList = existingStudents || []
    const rollMap = new Map<string, typeof dbList[0]>()
    const emailMap = new Map<string, typeof dbList[0]>()

    dbList.forEach(s => {
      rollMap.set(s.roll_number.toUpperCase(), s)
      emailMap.set(s.email.toLowerCase(), s)
    })

    const newRows: ValidatedStudentRow[] = []
    const existingRows: ValidatedStudentRow[] = []
    const conflicts: ImportRowError[] = []
    const analyzedStudents: RosterStudentAnalysis[] = []

    rows.forEach((row, idx) => {
      const rollKey = row.roll_number.toUpperCase()
      const emailKey = row.email.toLowerCase()

      const matchByRoll = rollMap.get(rollKey)
      const matchByEmail = emailMap.get(emailKey)

      if (matchByRoll && matchByEmail) {
        if (matchByRoll.id === matchByEmail.id) {
          // Exact match already registered in roster
          existingRows.push(row)
          analyzedStudents.push({
            row,
            status: 'existing',
            message: `Already in roster as "${matchByRoll.name}"`
          })
        } else {
          // Collision: roll belongs to student A, but email belongs to student B
          const err = {
            row: idx + 2,
            rollNumber: row.roll_number,
            message: `Collision: Roll ${row.roll_number} belongs to "${matchByRoll.name}", but email ${row.email} belongs to "${matchByEmail.name}" in database.`
          }
          conflicts.push(err)
          analyzedStudents.push({
            row,
            status: 'conflict',
            message: err.message
          })
        }
      } else if (matchByRoll && !matchByEmail) {
        // Roll exists with different email
        const err = {
          row: idx + 2,
          rollNumber: row.roll_number,
          message: `Roll number ${row.roll_number} already exists with different email (${matchByRoll.email}). Roster records are not overwritten.`
        }
        conflicts.push(err)
        analyzedStudents.push({
          row,
          status: 'conflict',
          message: err.message
        })
      } else if (!matchByRoll && matchByEmail) {
        // Email exists with different roll
        const err = {
          row: idx + 2,
          rollNumber: row.roll_number,
          message: `Email ${row.email} already exists under roll number ${matchByEmail.roll_number}. Duplicate emails are restricted.`
        }
        conflicts.push(err)
        analyzedStudents.push({
          row,
          status: 'conflict',
          message: err.message
        })
      } else {
        // Genuinely new student
        newRows.push(row)
        analyzedStudents.push({
          row,
          status: 'new',
          message: 'New student (Will be added to roster)'
        })
      }
    })

    return {
      totalRows: rows.length,
      validRows: rows,
      newRows,
      existingRows,
      conflicts,
      analyzedStudents
    }
  },

  // Perform bulk import into Supabase with duplicate DB check and non-destructive insertion
  async bulkImportStudents(rows: ValidatedStudentRow[]): Promise<ImportResult> {
    const result: ImportResult = {
      totalRows: rows.length,
      validCount: 0,
      insertedCount: 0,
      skippedExistingCount: 0,
      errors: []
    }

    if (rows.length === 0) return result

    if (!isSupabaseConfigured()) {
      // Demo mode simulated import
      result.validCount = rows.length
      result.insertedCount = rows.length
      return result
    }

    // 1. Analyze rows to identify genuinely new students and existing records
    const analysis = await this.analyzeRosterAgainstDatabase(rows)
    result.skippedExistingCount = analysis.existingRows.length
    result.errors.push(...analysis.conflicts)

    const toInsert = analysis.newRows
    result.validCount = toInsert.length

    // 2. Insert genuinely new student records one by one to ensure individual audit trail
    for (const student of toInsert) {
      const { data: insertedStudent, error: insertError } = await supabase
        .from('students')
        .insert({
          roll_number: student.roll_number.toUpperCase(),
          name: student.name,
          email: student.email.toLowerCase(),
          department: student.department,
          year: student.year,
          semester: student.semester || 1,
          section: student.section,
          status: 'Active'
        })
        .select()
        .single()

      if (insertError) {
        result.errors.push({
          row: 0,
          rollNumber: student.roll_number,
          message: `Database insertion error: ${insertError.message}`
        })
      } else if (insertedStudent) {
        result.insertedCount++

        // Optional initial contact details if provided
        if (student.phone) {
          await supabase.from('student_personal_details').insert({
            student_id: insertedStudent.id,
            phone: student.phone
          })
        }

        // Optional initial parent details if provided
        if (student.father_name || student.father_phone) {
          await supabase.from('student_family_details').insert({
            student_id: insertedStudent.id,
            father_name: student.father_name || null,
            father_phone: student.father_phone || null
          })
        }
      }
    }

    return result
  }
}
