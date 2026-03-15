import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges truthy classes and resolves Tailwind conflicts', () => {
    expect(cn('px-2', false, undefined, 'font-bold', 'px-4')).toBe(
      'font-bold px-4',
    )
  })
})
