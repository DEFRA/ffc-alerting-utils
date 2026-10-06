const { sanitizeValue } = require('../../../app/sanitize/sanitize-value')

describe('sanitizeValue', () => {
  test('should redact sensitive keys', () => {
    const result = sanitizeValue('secret123', 'password')
    expect(result).toBe('[REDACTED]')
  })

  test('should redact token key', () => {
    const result = sanitizeValue('token-value', 'token')
    expect(result).toBe('[REDACTED]')
  })

  test('should redact api_key', () => {
    const result = sanitizeValue('key-value', 'api_key')
    expect(result).toBe('[REDACTED]')
  })

  test('should redact null when key is sensitive', () => {
    const result = sanitizeValue(null, 'password')
    expect(result).toBe('[REDACTED]')
  })

  test('should redact undefined when key is sensitive', () => {
    const result = sanitizeValue(undefined, 'token')
    expect(result).toBe('[REDACTED]')
  })

  test('should return undefined for null with non-sensitive key', () => {
    expect(sanitizeValue(null, 'basic')).toBeUndefined()
  })

  test('should return undefined for undefined with non-sensitive key', () => {
    expect(sanitizeValue(undefined, 'basic')).toBeUndefined()
  })

  test('should preserve primitives', () => {
    expect(sanitizeValue(123, 'count')).toBe(123)
    expect(sanitizeValue(true, 'flag')).toBe(true)
    expect(sanitizeValue(false, 'flag')).toBe(false)
  })

  test('should redact long strings', () => {
    const longString = 'x'.repeat(201)
    expect(sanitizeValue(longString, 'normalKey')).toBe('[REDACTED]')
  })

  test('should preserve strings under max length', () => {
    const str = 'test str'
    expect(sanitizeValue(str, 'basic')).toBe(str)
  })

  test('should sanitize object properties', () => {
    const obj = { basic: 'val', password: 'secret' }
    const result = sanitizeValue(obj, 'root')
    expect(result).toEqual({ basic: 'val', password: '[REDACTED]' })
  })

  test('should return redacted object for object with only sensitive/null properties', () => {
    const obj = { password: 'secret', token: null }
    const result = sanitizeValue(obj, 'root')
    expect(result).toEqual({ password: '[REDACTED]', token: '[REDACTED]' })
  })

  test('should return undefined for object with only null properties', () => {
    const obj = { basic: null }
    const result = sanitizeValue(obj, 'root')
    expect(result).toBeUndefined()
  })

  test('should handle circular references in objects', () => {
    const obj = { key: 'value' }
    obj.self = obj
    const result = sanitizeValue(obj, 'root')
    expect(result.self).toBe('[Circular]')
  })

  test('should sanitize array elements', () => {
    const arr = ['value1', 'x'.repeat(201), 'value3']
    const result = sanitizeValue(arr, 'root')
    expect(result).toEqual(['value1', '[REDACTED]', 'value3'])
  })

  test('should handle circular references in arrays', () => {
    const arr = ['value']
    arr.push(arr)
    const result = sanitizeValue(arr, 'root')
    expect(result[1]).toBe('[Circular]')
  })

  test('should return undefined for array with only null/empty elements', () => {
    const arr = [null, '', undefined]
    const result = sanitizeValue(arr, 'root')
    expect(result).toBeUndefined()
  })

  test('should return undefined for empty array', () => {
    const result = sanitizeValue([], 'root')
    expect(result).toBeUndefined()
  })

  test('should handle non-primitive, non-array, non-object values (e.g., function)', () => {
    const func = () => 'test'
    expect(sanitizeValue(func, 'basic')).toBe(func)
  })

  test('should return object with redacted sensitive properties', () => {
    const obj = { password: 'secret' }
    const result = sanitizeValue(obj, 'root')
    expect(result).toEqual({ password: '[REDACTED]' })
  })
})
