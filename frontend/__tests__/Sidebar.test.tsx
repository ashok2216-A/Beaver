import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardSidebar } from '../components/dashboard-sidebar'

// Mock dependencies that aren't needed for this structural test
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button" />,
}))

test('sidebar renders the Billing link', () => {
  render(<DashboardSidebar />)
  
  const billingLink = screen.getByText(/Billing/i)
  expect(billingLink).toBeDefined()
  
  const billingIcon = billingLink.closest('a')?.querySelector('svg')
  expect(billingIcon).toBeDefined()
})

test('sidebar renders the Agents link', () => {
  render(<DashboardSidebar />)
  expect(screen.getByText(/Agents/i)).toBeDefined()
})
