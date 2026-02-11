let init, createAlerts, dataProcessingAlert, deriveAlertData, normalizeMessage, sanitizeValue

jest.mock('ffc-pay-event-publisher', () => ({
  EventPublisher: jest.fn(() => ({
    publishEvents: jest.fn().mockResolvedValue(undefined)
  }))
}))

describe('alerting-utils', () => {
  let originalEnv

  beforeAll(() => {
    originalEnv = { ...process.env }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    delete require.cache[require.resolve('../../app/index')]
    const mod = require('../../app/index')
    init = mod.init
    createAlerts = mod.createAlerts
    dataProcessingAlert = mod.dataProcessingAlert
    deriveAlertData = mod.deriveAlertData
    normalizeMessage = mod.normalizeMessage
    sanitizeValue = mod.sanitizeValue
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

  describe('init', () => {
    test('should set topic when provided', () => {
      init({ topic: 'test.topic' })
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))
      createAlerts([{ message: 'test' }], 'type', { EventPublisherClass: MockPublisher })
      expect(MockPublisher).toHaveBeenCalledWith('test.topic')
    })

    test('should set source when provided', () => {
      init({ source: 'test-source' })
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))
      createAlerts('test', 'type', { EventPublisherClass: MockPublisher })
      const alert = publishEventsMock.mock.calls[0][0][0]
      expect(alert.source).toBe('test-source')
    })

    test('should set defaultType when provided', () => {
      init({ defaultType: 'test.type' })
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))
      dataProcessingAlert({ process: 'test' }, undefined, { EventPublisherClass: MockPublisher })
      const publishedAlerts = publishEventsMock.mock.calls[0][0]
      expect(publishedAlerts[0].type).toBe('test.type')
    })

    test('should set EventPublisherClass when provided', () => {
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: jest.fn().mockResolvedValue(undefined)
      }))
      init({ EventPublisherClass: MockPublisher })
      createAlerts([{ message: 'test' }], 'type')
      expect(MockPublisher).toHaveBeenCalled()
    })

    test('should handle partial config', () => {
      init({ topic: 'partial.topic' })
      expect(true).toBe(true)
    })

    test('should not set topic when falsy', () => {
      init({ topic: '' })
      process.env.ALERT_TOPIC = 'env.topic'
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))
      createAlerts([{ message: 'test' }], 'type', { EventPublisherClass: MockPublisher })
      expect(MockPublisher).toHaveBeenCalledWith('env.topic')
    })
  })

  describe('createAlerts', () => {
    test('should handle empty input', async () => {
      const MockPublisher = jest.fn()
      await createAlerts([], 'test.type', { EventPublisherClass: MockPublisher })
      expect(MockPublisher).not.toHaveBeenCalled()
    })

    test('should convert single input to array', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts({ message: 'test' }, 'test.type', {
        EventPublisherClass: MockPublisher
      })

      expect(MockPublisher).toHaveBeenCalled()
    })

    test('should publish alerts via EventPublisher', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts([{ message: 'test' }], 'test.type', {
        EventPublisherClass: MockPublisher
      })

      expect(publishEventsMock).toHaveBeenCalled()
    })

    test('should use configured topic', async () => {
      init({ topic: 'configured.topic' })
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts([{ message: 'test' }], 'test.type', {
        EventPublisherClass: MockPublisher
      })

      expect(MockPublisher).toHaveBeenCalledWith('configured.topic')
    })

    test('should use env topic when no config', async () => {
      process.env.ALERT_TOPIC = 'env.topic'
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts([{ message: 'test' }], 'test.type', {
        EventPublisherClass: MockPublisher
      })

      expect(MockPublisher).toHaveBeenCalledWith('env.topic')
    })

    test('should use default topic when no env or config', async () => {
      delete process.env.ALERT_TOPIC
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts([{ message: 'test' }], 'test.type', {
        EventPublisherClass: MockPublisher
      })

      expect(MockPublisher).toHaveBeenCalledWith('ffc.alerts')
    })

    test('should log error on publish failure', async () => {
      const loggerMock = { error: jest.fn() }
      const publishError = new Error('publish failed')
      const publishEventsMock = jest.fn().mockRejectedValue(publishError)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await expect(
        createAlerts([{ message: 'test' }], 'test.type', {
          EventPublisherClass: MockPublisher,
          logger: loggerMock
        })
      ).rejects.toThrow('publish failed')

      expect(loggerMock.error).toHaveBeenCalled()
    })

    test('should filter out null alerts', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts([null, { message: 'test' }], 'test.type', {
        EventPublisherClass: MockPublisher
      })

      expect(publishEventsMock).toHaveBeenCalledWith([{ source: 'ffc-doc-alerting', type: 'test.type', data: { message: 'test' } }])
    })

    test('should handle array with only null inputs', async () => {
      const MockPublisher = jest.fn()
      await createAlerts([null], 'type', { EventPublisherClass: MockPublisher })
      expect(MockPublisher).not.toHaveBeenCalled()
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

    test('should throw when payload is not an object', async () => {
      await expect(dataProcessingAlert('string')).rejects.toThrow('payload must be an object')
    })

    test('should publish alert with process name', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
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
      const MockPublisher = jest.fn().mockImplementation(() => ({
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

    test('should use options defaultType when type not provided', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await dataProcessingAlert(
        { process: 'test' },
        undefined,
        { defaultType: 'options.type', EventPublisherClass: MockPublisher }
      )

      const publishedAlerts = publishEventsMock.mock.calls[0][0]
      expect(publishedAlerts[0].type).toBe('options.type')
    })

    test('should use env ALERT_TYPE when no type or defaultType', async () => {
      process.env.ALERT_TYPE = 'env.type'
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await dataProcessingAlert(
        { process: 'test' },
        undefined,
        { EventPublisherClass: MockPublisher }
      )

      const publishedAlerts = publishEventsMock.mock.calls[0][0]
      expect(publishedAlerts[0].type).toBe('env.type')
    })

    test('should use default type when no overrides', async () => {
      delete process.env.ALERT_TYPE
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await dataProcessingAlert(
        { process: 'test' },
        undefined,
        { EventPublisherClass: MockPublisher }
      )

      const publishedAlerts = publishEventsMock.mock.calls[0][0]
      expect(publishedAlerts[0].type).toBe('uk.gov.defra.ffc.doc.data.processing.error')
    })

    test('should not throw on publish error when throwOnPublishError is false', async () => {
      const MockPublisher = jest.fn().mockImplementation(() => ({
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
      const MockPublisher = jest.fn().mockImplementation(() => ({
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

  describe('toAlert (via createAlerts)', () => {
    test('should handle looksLikeAlert input with only data', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts({ data: { message: 'test' } }, 'type', { EventPublisherClass: MockPublisher })
      const alert = publishEventsMock.mock.calls[0][0][0]
      expect(alert.data).toEqual({ message: 'test' })
    })

    test('should handle looksLikeAlert input with empty data object', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts({ source: 'custom', data: {} }, 'type', { EventPublisherClass: MockPublisher })
      const alert = publishEventsMock.mock.calls[0][0][0]
      expect(alert.data).toEqual({ message: 'An error occurred' })
    })
    test('should return null for falsy input except 0', async () => {
      const MockPublisher = jest.fn()
      await createAlerts(null, 'type', { EventPublisherClass: MockPublisher })
      expect(MockPublisher).not.toHaveBeenCalled()
    })

    test('should handle input 0', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts(0, 'type', { EventPublisherClass: MockPublisher })
      expect(publishEventsMock).toHaveBeenCalled()
    })

    test('should handle looksLikeAlert input with source', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts({ source: 'custom', data: { message: 'test' } }, 'type', { EventPublisherClass: MockPublisher })
      const alert = publishEventsMock.mock.calls[0][0][0]
      expect(alert.source).toBe('custom')
    })

    test('should handle looksLikeAlert input with type', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts({ type: 'custom', data: { message: 'test' } }, 'fallback', { EventPublisherClass: MockPublisher })
      const alert = publishEventsMock.mock.calls[0][0][0]
      expect(alert.type).toBe('custom')
    })

    test('should handle looksLikeAlert input with null data', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts({ source: 'custom', type: 't', data: null }, 'fallback', { EventPublisherClass: MockPublisher })
      const alert = publishEventsMock.mock.calls[0][0][0]
      expect(alert.data).toEqual({ message: 'An error occurred' })
    })

    test('should handle Error input', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts(new Error('error'), 'type', { EventPublisherClass: MockPublisher })
      const alert = publishEventsMock.mock.calls[0][0][0]
      expect(alert.data.message).toBe('error')
    })
  })

  describe('buildErrorData (via toAlert)', () => {
    test('should return object with message for non-Error input', async () => {
      const publishEventsMock = jest.fn().mockResolvedValue(undefined)
      const MockPublisher = jest.fn().mockImplementation(() => ({
        publishEvents: publishEventsMock
      }))

      await createAlerts('string', 'type', { EventPublisherClass: MockPublisher })
      const alert = publishEventsMock.mock.calls[0][0][0]
      expect(alert.data).toEqual({ message: 'string' })
    })
  })
})
