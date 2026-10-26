// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminLogin } from '../src/features/authentication/AdminLogin'
import { AuthContext } from '../src/app/providers/AuthContext'
import { router } from '../src/app/router/index'
import { INITIAL_ROADMAP_ITEMS } from '../src/services/roadmapService'
import fs from 'fs'
import path from 'path'

// Mock Auth Context Value
const mockSignInWithPassword = vi.fn()
const mockResetPasswordForEmail = vi.fn()
const mockLoginAsDemo = vi.fn()
const mockSignUp = vi.fn()

const createMockAuthContext = (overrides = {}) => ({
  session: null,
  user: null,
  role: 'guest' as const,
  studentProfile: null,
  studentDbId: null,
  studentRollNumber: null,
  accountLinkingError: null,
  isConfigured: true,
  isDemoAllowed: false,
  isDemo: false,
  loading: false,
  signInWithPassword: mockSignInWithPassword,
  signUp: mockSignUp,
  signOut: vi.fn(),
  resetPasswordForEmail: mockResetPasswordForEmail,
  updatePassword: vi.fn(),
  loginAsDemo: mockLoginAsDemo,
  ...overrides,
})

describe('Mentor Connect — Public Administrator Registration Security Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('1. Faculty Login Interface Hardening', () => {
    it('does NOT display any "Create Administrator Account" link or button', () => {
      const mockAuth = createMockAuthContext()
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <MemoryRouter>
            <AdminLogin />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      // Confirm absolute absence of public registration links
      expect(screen.queryByText(/create administrator account/i)).toBeNull()
      expect(screen.queryByText(/first time faculty administrator/i)).toBeNull()
      expect(screen.queryByRole('button', { name: /create account/i })).toBeNull()
    })

    it('displays the institutional security restriction notice', () => {
      const mockAuth = createMockAuthContext()
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <MemoryRouter>
            <AdminLogin />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      const notice = screen.getByText(/Administrative access is restricted to authorized faculty mentors/i)
      expect(notice).toBeDefined()
    })

    it('preserves faculty email, password fields, and sign-in submission button', () => {
      const mockAuth = createMockAuthContext()
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <MemoryRouter>
            <AdminLogin />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      expect(screen.getByPlaceholderText(/mentor\.cseds@viit\.ac\.in/i)).toBeDefined()
      expect(screen.getByPlaceholderText(/••••••••/i)).toBeDefined()
      expect(
        screen.getByRole('button', { name: /Sign In to Mentor Workspace/i })
      ).toBeDefined()
      expect(screen.getByText(/Switch to Student Login/i)).toBeDefined()
    })

    it('does NOT render the administrator registration dialog in the DOM', () => {
      const mockAuth = createMockAuthContext()
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <MemoryRouter>
            <AdminLogin />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      expect(screen.queryByText(/Provision an administrative user in Supabase Auth/i)).toBeNull()
      expect(screen.queryByText(/Final Step — Assign Administrator Role in PostgreSQL/i)).toBeNull()
    })
  })

  describe('2. Routing & Route Protection Audit', () => {
    it('verifies no admin registration routes exist in the client router configuration', () => {
      // Traverse router routes
      const configuredRoutes: string[] = []
      const traverse = (routes: any[]) => {
        for (const r of routes) {
          if (r.path) configuredRoutes.push(r.path)
          if (r.children) traverse(r.children)
        }
      }
      traverse(router.routes)

      expect(configuredRoutes).not.toContain('/admin/register')
      expect(configuredRoutes).not.toContain('/register')
      expect(configuredRoutes).not.toContain('/login/admin/register')
      expect(configuredRoutes).not.toContain('register')
    })
  })

  describe('3. Database RLS Policies & Privilege Escalation Audit', () => {
    const migrationsDir = path.resolve(__dirname, '../supabase/migrations')
    const consolidatedSql = fs.readFileSync(
      path.join(migrationsDir, '20261025000000_stage2_consolidated_master.sql'),
      'utf8'
    )
    const hardenedTriggerSql = fs.readFileSync(
      path.join(migrationsDir, '20261025100000_reconcile_and_harden_auth_linking.sql'),
      'utf8'
    )

    it('ensures user_roles RLS restricts insert/update exclusively to existing admins', () => {
      // Policy: "Users can read own role" is SELECT only
      expect(consolidatedSql).toContain('CREATE POLICY "Users can read own role"')
      expect(consolidatedSql).toContain('ON public.user_roles FOR SELECT TO authenticated')

      // Policy: "Admins can manage user roles" requires is_admin() for ALL actions
      expect(consolidatedSql).toContain('CREATE POLICY "Admins can manage user roles"')
      expect(consolidatedSql).toContain('ON public.user_roles FOR ALL TO authenticated')
      expect(consolidatedSql).toContain('USING (public.is_admin()) WITH CHECK (public.is_admin())')
    })

    it('ensures is_admin() strictly checks public.user_roles, NEVER user metadata or claims', () => {
      expect(consolidatedSql).toContain('CREATE OR REPLACE FUNCTION public.is_admin()')
      expect(consolidatedSql).toContain('FROM public.user_roles')
      expect(consolidatedSql).toContain("WHERE user_id = auth.uid() AND role = 'admin'")

      // Must NOT check raw_user_meta_data or app_metadata
      expect(consolidatedSql).not.toContain("raw_user_meta_data->>'role' = 'admin'")
      expect(consolidatedSql).not.toContain("raw_app_meta_data->>'role' = 'admin'")
    })

    it('ensures auth account creation trigger strictly ignores uninvited self-signups', () => {
      // handle_new_auth_user checks invited_at IS NULL and aborts without granting any role
      expect(hardenedTriggerSql).toContain('IF NEW.invited_at IS NULL THEN')
      expect(hardenedTriggerSql).toContain('RETURN NEW;')
      expect(hardenedTriggerSql).toContain(
        'Self-signups or organic registrations without an invitation (invited_at IS NULL)'
      )
    })

    it('ensures invited account linking can only ever assign "student", never "admin"', () => {
      // The trigger only inserts 'student'
      expect(hardenedTriggerSql).toContain("VALUES (NEW.id, 'student')")
      expect(hardenedTriggerSql).not.toContain("VALUES (NEW.id, 'admin')")
    })
  })

  describe('4. Development Roadmap Tracking', () => {
    it('records public administrator registration removal in roadmap catalog', () => {
      const removedAdminReg = INITIAL_ROADMAP_ITEMS.find(
        (i) => i.title === 'Public Administrator Account Self-Registration'
      )

      expect(removedAdminReg).toBeDefined()
      expect(removedAdminReg?.category).toBe('removed')
      expect(removedAdminReg?.moduleLocation).toBe('Admin Portal')
      expect(removedAdminReg?.priority).toBe('high')
      expect(removedAdminReg?.reasonRemovedOrDeferred).toContain('Public administrator self-registration decommissioned')
    })
  })
})
