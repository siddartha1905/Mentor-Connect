import Papa from 'papaparse'
import { z } from 'zod'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const StudentRowSchema = z.object({
  roll_number: z.string().min(3, 'Roll number is required').regex(/^[A-Za-z0-9]+$/, 'Roll number must be alphanumeric'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  department: z.string().default('CSE-Data Science'),
  year: z.coerce.number().min(1).max(4).default(2),
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

export interface ImportResult {
  totalRows: number
  validCount: number
  insertedCount: number
  errors: ImportRowError[]
}

export const importService = {
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

            // Pre-process fields
            const normalized = {
              roll_number: String(rawRow.roll_number || rawRow.roll_no || rawRow.rollno || ''),
              name: String(rawRow.name || rawRow.student_name || rawRow.full_name || ''),
              email: String(rawRow.email || rawRow.student_email || ''),
              department: String(rawRow.department || rawRow.branch || 'CSE-Data Science'),
              year: Number(rawRow.year) || 2,
              section: String(rawRow.section || 'A'),
              phone: String(rawRow.phone || rawRow.mobile || ''),
              father_name: String(rawRow.father_name || rawRow.parent_name || ''),
              father_phone: String(rawRow.father_phone || '')
            }

            const parseResult = StudentRowSchema.safeParse(normalized)
            if (!parseResult.success) {
              const msg = parseResult.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')
              errors.push({
                row: rowNumber,
                rollNumber: normalized.roll_number,
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

  // Perform bulk import into Supabase with duplicate DB check
  async bulkImportStudents(rows: ValidatedStudentRow[]): Promise<ImportResult> {
    const result: ImportResult = {
      totalRows: rows.length,
      validCount: 0,
      insertedCount: 0,
      errors: []
    }

    if (!isSupabaseConfigured()) {
      // Demo mode simulated import
      result.validCount = rows.length
      result.insertedCount = rows.length
      return result
    }

    // Check existing roll numbers and emails in Supabase
    const rollNumbers = rows.map(r => r.roll_number.toUpperCase())
    const emails = rows.map(r => r.email.toLowerCase())

    const { data: existingStudents, error: fetchError } = await supabase
      .from('students')
      .select('roll_number, email')
      .or(`roll_number.in.(${rollNumbers.join(',')}),email.in.(${emails.join(',')})`)

    if (fetchError) {
      console.warn('Could not check existing records in bulk:', fetchError)
    }

    const existingRolls = new Set((existingStudents || []).map((s: { roll_number: string; email: string }) => s.roll_number.toUpperCase()))
    const existingEmails = new Set((existingStudents || []).map((s: { roll_number: string; email: string }) => s.email.toLowerCase()))

    const toInsert: ValidatedStudentRow[] = []

    rows.forEach((row, idx) => {
      if (existingRolls.has(row.roll_number.toUpperCase())) {
        result.errors.push({
          row: idx + 2,
          rollNumber: row.roll_number,
          message: `Roll number ${row.roll_number} already exists in database`
        })
        return
      }
      if (existingEmails.has(row.email.toLowerCase())) {
        result.errors.push({
          row: idx + 2,
          rollNumber: row.roll_number,
          message: `Email ${row.email} already registered in database`
        })
        return
      }
      toInsert.push(row)
    })

    result.validCount = toInsert.length

    // Insert student records
    for (const student of toInsert) {
      const { data: insertedStudent, error: insertError } = await supabase
        .from('students')
        .insert({
          roll_number: student.roll_number.toUpperCase(),
          name: student.name,
          email: student.email.toLowerCase(),
          department: student.department,
          year: student.year,
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

        // Insert initial personal details row if phone is present
        if (student.phone) {
          await supabase.from('student_personal_details').insert({
            student_id: insertedStudent.id,
            phone: student.phone
          })
        }

        // Insert initial family details row if father info is present
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
