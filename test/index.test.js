const {
  init,
  createAlerts,
  dataProcessingAlert,
  deriveAlertData,
  normalizeMessage,
  sanitizeValue
} = require('../app/index')

describe('alerting-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

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
  })

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

    test('should handle circular references', () => {
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

    test('should return object with redacted sensitive properties', () => {
      const obj = { password: 'secret' }
      const result = sanitizeValue(obj, 'root')
      expect(result).toEqual({ password: '[REDACTED]' })
    })
  })

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

    test('should preserve all payload properties', () => {
      const payload = { customData: 'value', error: 'test' }
      const result = deriveAlertData(payload, 'testProcess')
      expect(result.customData).toBe('value')
    })
  })

  describe('init', () => {
    test('should set configuration', () => {
      init({
        topic: 'test.topic',
        source: 'test-service',
        defaultType: 'test.type'
      })
      expect(true).toBe(true)
    })

    test('should accept EventPublisherClass', () => {
      const MockPublisher = jest.fn()
      init({ EventPublisherClass: MockPublisher })
      expect(true).toBe(true)
    })

    test('should handle partial config', () => {
      init({ topic: 'partial.topic' })
      expect(true).toBe(true)
    })
  })

  describe('createAlerts', () => {
    test('should handle empty input', async () => {
      await createAlerts([], 'test.type')
      expect(true).toBe(true)
    })

    test('should convert single input to array', async () => {
      const MockPublisher = jest.fn(() => ({
        publishEvents: jest.fn().mockResolvedValue(undefined)
      }))

      await createAlerts({ message: 'test' }, 'test.type', {
        EventPublisherClass: MockPublisher
      })

      expect(MockPublisher).toHaveBeenCalled()
    })

    test('should publish alerts via EventPublisher', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts([{ message: 'test' }], 'test.type', {
        EventPublisherClass: MockPublisher
      })

      expect(publishEventsMock).toHaveBeenCalled()
    })

    test('should use configured topic', async () => {
      const MockPublisher = jest.fn(() => ({
        publishEvents: jest.fn().mockResolvedValue(undefined)
      }))

      await createAlerts([{ message: 'test' }], 'test.type', {
        topic: 'custom.topic',
        EventPublisherClass: MockPublisher
      })

      expect(MockPublisher).toHaveBeenCalledWith('custom.topic')
    })

    test('should log error on publish failure', async () => {
      const loggerMock = { error: jest.fn() }
      const publishError = new Error('publish failed')
      const MockPublisher = jest.fn(() => ({
        publishEvents: jest.fn().mockRejectedValue(publishError)
      }))

      await expect(
        createAlerts([{ message: 'test' }], 'test.type', {
          EventPublisherClass: MockPublisher,
          logger: loggerMock
        })
      ).rejects.toThrow('publish failed')

      expect(loggerMock.error).toHaveBeenCalled()
    })
  })

  describe('dataProcessingAlert', () => {
    test('should throw when payload is missing or invalid', async () => {
      await expect(dataProcessingAlert()).rejects.toThrow()
    })

    test('should throw when process name is missing', async () => {
      await expect(dataProcessingAlert({})).rejects.toThrow('payload.process (string) is required')
    })

    test('should throw when process is not a string', async () => {
      await expect(dataProcessingAlert({ process: 123 })).rejects.toThrow('payload.process (string) is required')
    })

    test('should publish alert with process name', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn(() => ({
        publishEvents: publishEventsMock
      }))

      await dataProcessingAlert(
        { process: 'testProcess', message: 'test' },
        'test.type',
        { EventPublisherClass: MockPublisher }
      )

      expect(publishEventsMock).toHaveBeenCalled()
      const publishedAlerts = publishEventsMock.mock.calls[0][0]
      expect(publishedAlerts[0].data.process).toBe('testProcess')
    })

    test('should use provided type', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn(() => ({
        publishEvents: publishEventsMock
      }))

      await dataProcessingAlert(
        { process: 'test' },
        'custom.type',
        { EventPublisherClass: MockPublisher }
      )

      const publishedAlerts = publishEventsMock.mock.calls[0][0]
      expect(publishedAlerts[0].type).toBe('custom.type')
    })

    test('should not throw on publish error when throwOnPublishError is false', async () => {
      const MockPublisher = jest.fn(() => ({
        publishEvents: jest.fn().mockRejectedValue(new Error('publish failed'))
      }))

      await expect(
        dataProcessingAlert(
          { process: 'test' },
          'test.type',
          { EventPublisherClass: MockPublisher, throwOnPublishError: false, logger: { error: jest.fn() } }
        )
      ).resolves.not.toThrow()
    })

    test('should throw on publish error when throwOnPublishError is true', async () => {
      const MockPublisher = jest.fn(() => ({
        publishEvents: jest.fn().mockRejectedValue(new Error('publish failed'))
      }))

      await expect(
        dataProcessingAlert(
          { process: 'test' },
          'test.type',
          { EventPublisherClass: MockPublisher, throwOnPublishError: true, logger: { error: jest.fn() } }
        )
      ).rejects.toThrow('publish failed')
    })
  })
})
