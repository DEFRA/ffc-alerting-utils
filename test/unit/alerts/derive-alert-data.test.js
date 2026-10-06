const { deriveAlertData } = require('../../../app/alerts/derive-alert-data')

describe('deriveAlertData', () => {
  test('should include process name', () => {
    const payload = { error: 'test' }
    const result = deriveAlertData(payload, 'testProcess')
    expect(result.process).toBe('testProcess')
  })

  test('should preserve existing message', () => {
    const payload = { message: 'existing message' }
    const result = deriveAlertData(payload, 'testProcess')
    expect(result.message).toBe('existing message')
  })

  test('should extract Error message', () => {
    const payload = { error: new Error('error message') }
    const result = deriveAlertData(payload, 'testProcess')
    expect(result.message).toBe('error message')
  })

  test('should extract object message property', () => {
    const payload = { error: { message: 'object error' } }
    const result = deriveAlertData(payload, 'testProcess')
    expect(result.message).toBe('object error')
  })

  test('should use string error as message and clear it', () => {
    const payload = { error: 'string error' }
    const result = deriveAlertData(payload, 'testProcess')
    expect(result.message).toBe('string error')
    expect(result.error).toBeNull()
  })

  test('should generate default message when missing', () => {
    const payload = {}
    const result = deriveAlertData(payload, 'myProcess')
    expect(result.message).toBe('Failed processing myProcess')
  })

  test('should generate default message for empty string message', () => {
    const payload = { message: '' }
    const result = deriveAlertData(payload, 'myProcess')
    expect(result.message).toBe('Failed processing myProcess')
  })

  test('should generate default message for whitespace-only message', () => {
    const payload = { message: '   ' }
    const result = deriveAlertData(payload, 'myProcess')
    expect(result.message).toBe('Failed processing myProcess')
  })

  test('should generate default message for null message', () => {
    const payload = { message: null }
    const result = deriveAlertData(payload, 'myProcess')
    expect(result.message).toBe('Failed processing myProcess')
  })

  test('should preserve all payload properties', () => {
    const payload = { customData: 'value', error: 'test' }
    const result = deriveAlertData(payload, 'testProcess')
    expect(result.customData).toBe('value')
  })

  test('should handle error as non-Error, non-object, non-string', () => {
    const payload = { error: 123 }
    const result = deriveAlertData(payload, 'myProcess')
    expect(result.message).toBe('Failed processing myProcess')
  })
})
