import { afterEach, describe, expect, it, vi } from 'vitest'
import { escapeCsvValue, triggerDownload } from './export'

describe('escapeCsvValue', () => {
  it('returns empty text for nullish and unserializable object values', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular

    expect(escapeCsvValue(null)).toBe('')
    expect(escapeCsvValue(undefined)).toBe('')
    expect(escapeCsvValue(circular)).toBe('')
    expect(escapeCsvValue({ toJSON: () => undefined })).toBe('')
  })

  it('quotes CSV-sensitive strings and escapes embedded quotes', () => {
    expect(escapeCsvValue('plain')).toBe('plain')
    expect(escapeCsvValue('hello, world')).toBe('"hello, world"')
    expect(escapeCsvValue('say "hello"\nnext')).toBe('"say ""hello""\nnext"')
    expect(escapeCsvValue({ name: 'runner', values: [1, 2] })).toBe(
      '"{""name"":""runner"",""values"":[1,2]}"',
    )
  })

  it('formats primitive and callable values', () => {
    function namedExport() {}

    expect(escapeCsvValue(Symbol('marker'))).toBe('marker')
    expect(escapeCsvValue(Symbol())).toBe('Symbol()')
    expect(escapeCsvValue(namedExport)).toBe('namedExport')
    expect(escapeCsvValue(42)).toBe('42')
    expect(escapeCsvValue(42n)).toBe('42')
    expect(escapeCsvValue(true)).toBe('true')
    expect(escapeCsvValue(false)).toBe('false')
  })
})

describe('triggerDownload', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('creates, clicks, removes, and asynchronously revokes a download link', () => {
    vi.useFakeTimers()
    const createObjectURL = vi.fn(() => 'blob:test-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    triggerDownload('a,b\n1,2', 'text/csv', 'report.csv')

    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'text/csv' }),
    )
    expect(click).toHaveBeenCalledTimes(1)
    expect(document.querySelector('a[download="report.csv"]')).toBeNull()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url')
  })

  it('supports environments without URL revocation', () => {
    const createObjectURL = vi.fn(() => 'blob:no-revoke')
    vi.stubGlobal('URL', { createObjectURL })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    expect(() =>
      triggerDownload('{}', 'application/json', 'data.json'),
    ).not.toThrow()
    expect(createObjectURL).toHaveBeenCalledTimes(1)
  })
})
