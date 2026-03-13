import { render, screen } from '@testing-library/react'
import { PropertyValueRenderer } from '@/components/submodels/capability/PropertyValueRenderer'
import type { ParsedPropertyValue } from '@/lib/types/capability'

describe('PropertyValueRenderer', () => {
  describe('range type', () => {
    it('renders min → max for a range value', () => {
      const data: ParsedPropertyValue = { type: 'range', min: '0.8', max: '1.6' }
      render(<PropertyValueRenderer data={data} />)
      expect(screen.getByText('0.8 → 1.6')).toBeInTheDocument()
    })

    it('renders "? → ?" when min and max are undefined', () => {
      const data: ParsedPropertyValue = { type: 'range' }
      render(<PropertyValueRenderer data={data} />)
      expect(screen.getByText('? → ?')).toBeInTheDocument()
    })
  })

  describe('list type', () => {
    it('renders all list items as badges', () => {
      const data: ParsedPropertyValue = {
        type: 'list',
        items: ['Steel', 'Aluminium', 'Copper'],
      }
      render(<PropertyValueRenderer data={data} />)
      expect(screen.getByText('Steel')).toBeInTheDocument()
      expect(screen.getByText('Aluminium')).toBeInTheDocument()
      expect(screen.getByText('Copper')).toBeInTheDocument()
    })

    it('renders nothing for an empty list without crashing', () => {
      const data: ParsedPropertyValue = { type: 'list', items: [] }
      const { container } = render(<PropertyValueRenderer data={data} />)
      expect(container.innerHTML).toBe('')
    })
  })

  describe('single type', () => {
    it('renders a badge when value is "true"', () => {
      const data: ParsedPropertyValue = { type: 'single', value: 'true' }
      render(<PropertyValueRenderer data={data} />)
      const badge = screen.getByText('true')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('[data-slot="badge"]')).not.toBeNull()
    })

    it('renders plain text for a numeric string value', () => {
      const data: ParsedPropertyValue = { type: 'single', value: '42.5' }
      render(<PropertyValueRenderer data={data} />)
      const el = screen.getByText('42.5')
      expect(el).toBeInTheDocument()
      expect(el.tagName.toLowerCase()).toBe('span')
      expect(el.closest('[data-slot="badge"]')).toBeNull()
    })
  })
})
