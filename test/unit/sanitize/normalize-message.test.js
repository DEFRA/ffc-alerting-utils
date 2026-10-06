const { normalizeMessage } = require('../../../app/sanitize/normalize-message')

describe('normalizeMessage', () => {
  test('should return message from Error object', () => {
    const error = new Error('Test error')
    expect(normalizeMessage(error)).toBe('Test error')
  })

  test('should return default message for null', () => {
    expect(normalizeMessage(null)).toBe('An error occurred')
  })

  test('should return default message for undefined', () => {
    expect(normalizeMessage(undefined)).toBe('An error occurred')
  })

  test('should return trimmed string', () => {
    expect(normalizeMessage('  test message  ')).toBe('test message')
  })

  test('should return default message for empty string', () => {
    expect(normalizeMessage('  ')).toBe('An error occurred')
  })

  test('should convert number to string', () => {
    expect(normalizeMessage(123)).toBe('123')
  })

  test('should convert boolean to string', () => {
    expect(normalizeMessage(true)).toBe('true')
  })

  test('should convert false boolean to string', () => {
    expect(normalizeMessage(false)).toBe('false')
  })

  test('should extract msg property from object', () => {
    expect(normalizeMessage({ msg: 'object message' })).toBe('object message')
  })

  test('should extract message property from object', () => {
    expect(normalizeMessage({ message: 'object message' })).toBe('object message')
  })

  test('should prefer msg over message', () => {
    expect(normalizeMessage({ msg: 'msg value', message: 'message value' })).toBe('msg value')
  })

  test('should return default for object without msg or message', () => {
    expect(normalizeMessage({ data: 'test' })).toBe('An error occurred')
  })

  test('should handle non-object, non-primitive inputs (e.g., function)', () => {
    const func = () => {}
    expect(normalizeMessage(func)).toBe('An error occurred')
  })

  test('should handle zero as valid input', () => {
    expect(normalizeMessage(0)).toBe('0')
  })
})
