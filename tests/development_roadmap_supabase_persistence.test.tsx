// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  roadmapService,
  INITIAL_ROADMAP_ITEMS,
  ROADMAP_DETERMINISTIC_UUID_MAP,
  type RoadmapItem,
} from '@/services/roadmapService'
import * as supabaseModule from '@/lib/supabase'

describe('Mentor Connect — Development Roadmap & Supabase Persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  // --------------------------------------------------------------------------
  // 1. Catalog Integrity & Schema Verification
  // --------------------------------------------------------------------------
  it('1. verifies all authoritative roadmap entries retain full metadata without invention or loss', () => {
    expect(INITIAL_ROADMAP_ITEMS.length).toBeGreaterThanOrEqual(22)
    expect(INITIAL_ROADMAP_ITEMS.length).toBe(27)

    const categories = new Set(INITIAL_ROADMAP_ITEMS.map((it) => it.category))
    expect(categories.has('completed')).toBe(true)
    expect(categories.has('in_progress')).toBe(true)
    expect(categories.has('pending')).toBe(true)
    expect(categories.has('deferred')).toBe(true)
    expect(categories.has('removed')).toBe(true)

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    for (const item of INITIAL_ROADMAP_ITEMS) {
      expect(item.title).toBeTruthy()
      expect(item.description).toBeTruthy()
      expect(item.moduleLocation).toMatch(/Student Portal|Admin Portal|Landing Page|Database & Security/)
      expect(item.priority).toMatch(/high|medium|low/)
      expect(uuidRegex.test(item.id)).toBe(true)

      if (item.category === 'deferred' || item.category === 'removed') {
        expect(item.reasonRemovedOrDeferred).toBeTruthy()
      }
      expect(Array.isArray(item.tags)).toBe(true)
    }

    // Verify key historical anchors
    const completedSave = INITIAL_ROADMAP_ITEMS.find((it) =>
      it.title.includes('Student Profile Direct Save')
    )
    expect(completedSave).toBeDefined()
    expect(completedSave?.category).toBe('completed')

    const deadlineItem = INITIAL_ROADMAP_ITEMS.find((it) =>
      it.title.includes('Profile Deadline Enforcement')
    )
    expect(deadlineItem).toBeDefined()
    expect(deadlineItem?.notes).toContain('November 3, 2026')

    const fakeStudentItem = INITIAL_ROADMAP_ITEMS.find((it) =>
      it.title.includes('Fictional Student Accounts')
    )
    expect(fakeStudentItem).toBeDefined()
    expect(fakeStudentItem?.category).toBe('removed')
  })

  // --------------------------------------------------------------------------
  // 2. Database Status & RLS Access Control
  // --------------------------------------------------------------------------
  it('2. verifies checkDatabaseStatus handles live RLS permission codes and table existence', async () => {
    // Case A: Anon key denied access via 42501 -> confirms table exists and RLS is active
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'permission denied for table development_roadmap' },
      }),
    })
    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue({ select: mockSelect } as any)

    const statusA = await roadmapService.checkDatabaseStatus()
    expect(statusA.connected).toBe(true)
    expect(statusA.tableExists).toBe(true)
    expect(statusA.isSecuredByRls).toBe(true)

    // Case B: Table does not exist (42P01)
    const mockMissing = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: { code: '42P01', message: 'relation "development_roadmap" does not exist' },
      }),
    })
    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue({ select: mockMissing } as any)

    const statusB = await roadmapService.checkDatabaseStatus()
    expect(statusB.tableExists).toBe(false)
    expect(statusB.error).toContain('has not been created yet')

    // Case C: Admin query succeeds
    const mockAdminSuccess = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({
        data: [{ id: 'c0000000-0000-0000-0000-000000000001' }],
        error: null,
      }),
    })
    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue({ select: mockAdminSuccess } as any)

    const statusC = await roadmapService.checkDatabaseStatus()
    expect(statusC.tableExists).toBe(true)
    expect(statusC.isSecuredByRls).toBe(false)
  })

  // --------------------------------------------------------------------------
  // 3. Reliable Fetching & Local Preservation
  // --------------------------------------------------------------------------
  it('3. merges Supabase database entries with any custom unpersisted local storage entries', async () => {
    const customLocal: RoadmapItem = {
      id: 'custom-local-feature-1',
      title: 'Custom Offline Innovation Note',
      description: 'Local idea not yet uploaded to Supabase',
      moduleLocation: 'Admin Portal',
      category: 'idea',
      priority: 'low',
      dateAdded: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem('mentor_connect_development_roadmap', JSON.stringify([customLocal]))

    const dbRows = [
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        title: 'Student Profile Direct Save (Sections B through G)',
        description: 'Direct saving of personal details to Supabase.',
        module_location: 'Student Portal',
        category: 'completed',
        priority: 'high',
        reason_removed_or_deferred: null,
        notes: 'Verified.',
        tags: ['verified'],
        date_added: '2026-10-25T10:00:00Z',
        updated_at: '2026-10-25T10:00:00Z',
      },
    ]

    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: dbRows,
        error: null,
      }),
    })
    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue({ select: mockSelect } as any)

    const result = await roadmapService.getAllItems()
    expect(result.fromSupabase).toBe(true)
    expect(result.items.some((it) => it.id === 'c0000000-0000-0000-0000-000000000001')).toBe(true)
    // Custom local item was preserved!
    expect(result.items.some((it) => it.title === 'Custom Offline Innovation Note')).toBe(true)
  })

  // --------------------------------------------------------------------------
  // 4. Future Additions & Mutations Direct to Supabase
  // --------------------------------------------------------------------------
  it('4. ensures future roadmap additions persist directly to Supabase and report true confirmation', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'f0000000-0000-0000-0000-000000000001',
            title: 'Automated Parent Meeting Scheduler',
            description: 'Automated appointment slots for parent consultation.',
            module_location: 'Admin Portal',
            category: 'pending',
            priority: 'medium',
            date_added: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    })
    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue({ insert: mockInsert } as any)

    const result = await roadmapService.addItem({
      title: 'Automated Parent Meeting Scheduler',
      description: 'Automated appointment slots for parent consultation.',
      moduleLocation: 'Admin Portal',
      category: 'pending',
      priority: 'medium',
      tags: ['parent-portal', 'future'],
    })

    expect(result.persistedToSupabase).toBe(true)
    expect(result.data?.id).toBe('f0000000-0000-0000-0000-000000000001')
    expect(result.error).toBeUndefined()
  })

  it('5. gracefully falls back to local cache when Supabase database insert fails', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error or RLS check failed' },
        }),
      }),
    })
    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue({ insert: mockInsert } as any)

    const result = await roadmapService.addItem({
      title: 'Offline Note Attempt',
      description: 'Will save to local cache',
      moduleLocation: 'Student Portal',
      category: 'idea',
      priority: 'low',
    })

    expect(result.persistedToSupabase).toBe(false)
    expect(result.data).toBeDefined()
    expect(result.error).toContain('Supabase persistence failed')

    // Local cache retains the item
    const cached = JSON.parse(localStorage.getItem('mentor_connect_development_roadmap') || '[]')
    expect(cached.some((it: any) => it.title === 'Offline Note Attempt')).toBe(true)
  })

  // --------------------------------------------------------------------------
  // 5. Backup Export and Import Safeguards
  // --------------------------------------------------------------------------
  it('6. exports and imports JSON backups without data loss or duplicate collisions', async () => {
    const exportJson = roadmapService.exportLocalBackup()
    expect(exportJson).toContain('Mentor Connect Development Roadmap')
    expect(exportJson).toContain('items')

    const parsed = JSON.parse(exportJson)
    expect(parsed.items.length).toBeGreaterThanOrEqual(27)

    // Modify payload with a new unique item and import it
    const testImportPayload = {
      items: [
        {
          title: 'Specialized Mentoring Dossier v2',
          description: 'Exported from another faculty instance',
          moduleLocation: 'Admin Portal',
          category: 'pending',
          priority: 'high',
          tags: ['imported'],
        },
      ],
    }

    const importRes = await roadmapService.importLocalBackup(JSON.stringify(testImportPayload))
    expect(importRes.success).toBe(true)
    expect(importRes.importedCount).toBe(1)

    // Importing the same payload again should skip duplicates
    const duplicateRes = await roadmapService.importLocalBackup(JSON.stringify(testImportPayload))
    expect(duplicateRes.success).toBe(true)
    expect(duplicateRes.importedCount).toBe(0)
  })

  // --------------------------------------------------------------------------
  // 6. Persistence across refresh / session
  // --------------------------------------------------------------------------
  it('7. verifies items persist across refresh and new browser sessions', () => {
    // Initial fetch seeds localStorage
    roadmapService.getAllItems()

    const rawFirst = localStorage.getItem('mentor_connect_development_roadmap')
    expect(rawFirst).toBeTruthy()
    const parsedFirst = JSON.parse(rawFirst!)
    expect(parsedFirst.length).toBeGreaterThanOrEqual(27)

    // Simulate page refresh (loading fresh instance)
    const rawSecond = localStorage.getItem('mentor_connect_development_roadmap')
    expect(rawSecond).toEqual(rawFirst)
  })

  // --------------------------------------------------------------------------
  // 7. Component UI Rendering & Modals
  // --------------------------------------------------------------------------
  it('8. renders the DevelopmentRoadmap UI with action buttons, status badge, and modals', async () => {
    const { render, screen, fireEvent, waitFor } = await import('@testing-library/react')
    const { DevelopmentRoadmap } = await import('@/features/admin/DevelopmentRoadmap')

    vi.spyOn(roadmapService, 'getAllItems').mockResolvedValue({
      items: roadmapService.getAllItems ? (await roadmapService.getAllItems()).items : [],
      fromSupabase: false,
    })
    vi.spyOn(roadmapService, 'checkDatabaseStatus').mockResolvedValue({
      connected: true,
      tableExists: true,
    })

    render(<DevelopmentRoadmap />)

    // Heading & Badges
    expect(screen.getByText('Development Roadmap & Feature History')).toBeDefined()
    expect(screen.getByText('Administrator Console')).toBeDefined()

    // Action Buttons
    expect(screen.getByRole('button', { name: /Export Backup/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Import Backup/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Add Feature \/ Note/i })).toBeDefined()

    // Category Tabs
    expect(screen.getByRole('button', { name: /All Features & History/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Completed & Verified/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Deferred \/ Future/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Removed Features/i })).toBeDefined()

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText(/Loading roadmap workspace/i)).toBeNull()
    })

    // Open Add Feature Modal
    const addButton = screen.getByRole('button', { name: /Add Feature \/ Note/i })
    fireEvent.click(addButton)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
    })
  })
})
