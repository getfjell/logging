import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

// Mock fetch for testing
global.fetch = vi.fn()

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful fetch responses
    ;(global.fetch as any).mockResolvedValue({
      ok: false, // This will trigger fallback content
      text: () => Promise.resolve(''),
      json: () => Promise.resolve({ version: '4.4.7' })
    })
  })

  it('renders the main heading', async () => {
    render(<App />)

    // Should render the brand title
    expect(screen.getByText('Fjell')).toBeInTheDocument()
    expect(screen.getByText('Logging')).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<App />)

    expect(screen.getByText(/Straightforward logging that/)).toBeInTheDocument()
    expect(screen.getByText(/cuts through the noise/)).toBeInTheDocument()
  })

  it('renders navigation sections', () => {
    render(<App />)

    // Should render navigation items
    expect(screen.getByText('Foundation')).toBeInTheDocument()
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
    expect(screen.getByText('Examples')).toBeInTheDocument()
    expect(screen.getByText('Configuration')).toBeInTheDocument()
  })

  it('renders external links', () => {
    render(<App />)

    // Should have links to GitHub and npm
    expect(screen.getByText('View Source')).toBeInTheDocument()
    expect(screen.getByText('Install Package')).toBeInTheDocument()
  })
})
