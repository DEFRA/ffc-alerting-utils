const { dataProcessingAlert } = require('../../../app/alerts/data-processing-alert')
const { init } = require('../../../app/config/init')
const { resetState } = require('../helpers/reset-state')
const { createAlerts } = require('../../../app/publish/create-alerts')

jest.mock('../../../app/publish/create-alerts', () => ({
  createAlerts: jest.fn().mockResolvedValue()
}))

const connectionConfig = {
  host: 'test.servicebus.windows.net',
  username: 'RootManageSharedAccessKey',
  password: 'test-key'
}

describe('dataProcessingAlert', () => {
  let originalEnv

  beforeAll(() => {
    originalEnv = { ...process.env }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  beforeEach(() => {
    jest.clearAllMocks()
    resetState()
    delete process.env.ALERT_TYPE
  })

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
    await dataProcessingAlert(
      { process: 'testProcess', message: 'test' },
      'test.type',
      { connectionConfig }
    )

    expect(createAlerts).toHaveBeenCalled()
    const publishedAlerts = createAlerts.mock.calls[0][0]
    expect(publishedAlerts[0].process).toBe('testProcess')
  })

  test('should use provided type', async () => {
    await dataProcessingAlert(
      { process: 'test' },
      'custom.type',
      { connectionConfig }
    )

    expect(createAlerts).toHaveBeenCalledWith(expect.any(Array), 'custom.type', expect.any(Object))
  })

  test('should use options defaultType when type not provided', async () => {
    await dataProcessingAlert(
      { process: 'test' },
      undefined,
      { defaultType: 'options.type', connectionConfig }
    )

    expect(createAlerts).toHaveBeenCalledWith(expect.any(Array), 'options.type', expect.any(Object))
  })

  test('should use env ALERT_TYPE when no type or defaultType', async () => {
    process.env.ALERT_TYPE = 'env.type'

    await dataProcessingAlert(
      { process: 'test' },
      undefined,
      { connectionConfig }
    )

    expect(createAlerts).toHaveBeenCalledWith(expect.any(Array), 'env.type', expect.any(Object))
  })

  test('should use default type when no overrides', async () => {
    delete process.env.ALERT_TYPE

    await dataProcessingAlert(
      { process: 'test' },
      undefined,
      { connectionConfig }
    )

    expect(createAlerts).toHaveBeenCalledWith(expect.any(Array), 'uk.gov.defra.ffc.doc.data.processing.error', expect.any(Object))
  })

  test('should use configured defaultType', async () => {
    init({ defaultType: 'configured.type', connectionConfig })

    await dataProcessingAlert(
      { process: 'test' },
      undefined
    )

    expect(createAlerts).toHaveBeenCalledWith(expect.any(Array), 'configured.type', expect.any(Object))
  })

  test('should not throw on publish error when throwOnPublishError is false', async () => {
    createAlerts.mockRejectedValueOnce(new Error('publish failed'))

    await expect(
      dataProcessingAlert(
        { process: 'test' },
        'test.type',
        { throwOnPublishError: false, logger: { error: jest.fn() }, connectionConfig }
      )
    ).resolves.toBeUndefined()
  })

  test('should throw on publish error when throwOnPublishError is true', async () => {
    createAlerts.mockRejectedValueOnce(new Error('publish failed'))

    await expect(
      dataProcessingAlert(
        { process: 'test' },
        'test.type',
        { throwOnPublishError: true, logger: { error: jest.fn() }, connectionConfig }
      )
    ).rejects.toThrow('publish failed')
  })
})
