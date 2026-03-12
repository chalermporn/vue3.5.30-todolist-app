import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('returns empty string with no args', () => {
    expect(cn()).toBe('')
  })

  it('joins class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves conflicting tailwind classes (last wins)', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })

  it('filters falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, null as any, 'baz')).toBe('foo baz')
  })

  it('handles conditional object syntax', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
  })

  it('handles array syntax', () => {
    expect(cn(['a', 'b'])).toBe('a b')
  })
})
