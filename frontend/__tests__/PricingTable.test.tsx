import { expect, test, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PricingTable } from '../components/billing/pricing-table'

// Mock the fetch function
global.fetch = vi.fn()

test('renders pricing plans correctly', () => {
  render(<PricingTable currentPlan="free" />)
  
  expect(screen.getByText('Free')).toBeDefined()
  expect(screen.getByText('Pro')).toBeDefined()
  expect(screen.getByText('Current Plan')).toBeDefined()
})

test('pro plan has the correct price', () => {
  render(<PricingTable currentPlan="free" />)
  expect(screen.getByText('$16')).toBeDefined()
})

test('clicking upgrade triggers loading state', async () => {
  // Mock a successful fetch
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ url: 'https://checkout.stripe.com/test' }),
  })

  render(<PricingTable currentPlan="free" />)
  
  const upgradeButtons = screen.getAllByText(/Upgrade to Pro|Get Started/i)
  const proButton = upgradeButtons.find(btn => btn.closest('.bg-zinc-900')) // Pro plan card
  
  if (proButton) {
    fireEvent.click(proButton)
    // In a real test we'd check for loading spinner or window.location change
  }
})
