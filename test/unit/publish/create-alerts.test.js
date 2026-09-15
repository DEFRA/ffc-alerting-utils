const { createAlerts } = require('../../../app/publish/create-alerts')
const { init } = require('../../../app/config/init')
const { resetState } = require('../helpers/reset-state')
const { clearCache } = require('../../../app/messaging/service-bus/sender-cache')
const { sendBatchMessages } = require('../../../app/messaging/service-bus/send-batch-messages')

jest.mock('../../../app/messaging/service-bus/sender-cache', () => ({
  getSender: jest.fn(),
  closeSenders: jest.fn().mockResolvedValue(),
  clearCache: jest.fn()
}))

jest.mock('../../../app/messaging/service-bus/send-batch-messages', () => ({
  sendBatchMessages: jest.fn().mockResolvedValue()
}))

const { getSender } = require('../../../app/messaging/service-bus/sender-cache')

const baseConnectionConfig = {
  host: 'test.servicebus.windows.net',
  username: 'RootManageSharedAccessKey',
  password: 'test-key'
}

describe('createAlerts', () => {
  let originalEnv
  const mockSender = { name: 'sender' }

  beforeAll(() => {
    originalEnv = { ...process.env }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  beforeEach(() => {
    jest.clearAllMocks()
    resetState()
    clearCache()
    delete process.env.ALERT_TOPIC
    getSender.mockReturnValue(mockSender)
  })

  test('should handle empty input', async () => {
    await createAlerts([], 'test.type', { connectionConfig: baseConnectionConfig })
    expect(getSender).not.toHaveBeenCalled()
    expect(sendBatchMessages).not.toHaveBeenCalled()
  })

  test('should convert single input to array', async () => {
    await createAlerts({ message: 'test' }, 'test.type', { connectionConfig: baseConnectionConfig })

    expect(getSender).toHaveBeenCalledWith(expect.objectContaining({ address: 'ffc.alerts' }))
    expect(sendBatchMessages).toHaveBeenCalled()
  })

  test('should publish alerts via native service bus', async () => {
    await createAlerts([{ message: 'test' }], 'test.type', { connectionConfig: baseConnectionConfig })

    expect(getSender).toHaveBeenCalled()
    expect(sendBatchMessages).toHaveBeenCalledWith(mockSender, expect.any(Array))
  })

  test('should use configured topic', async () => {
    init({ topic: 'configured.topic', connectionConfig: baseConnectionConfig })

    await createAlerts([{ message: 'test' }], 'test.type')

    expect(getSender).toHaveBeenCalledWith(expect.objectContaining({ address: 'configured.topic' }))
  })

  test('should use env topic when no config', async () => {
    process.env.ALERT_TOPIC = 'env.topic'

    await createAlerts([{ message: 'test' }], 'test.type', { connectionConfig: baseConnectionConfig })

    expect(getSender).toHaveBeenCalledWith(expect.objectContaining({ address: 'env.topic' }))
  })

  test('should use default topic when no env or config', async () => {
    delete process.env.ALERT_TOPIC

    await createAlerts([{ message: 'test' }], 'test.type', { connectionConfig: baseConnectionConfig })

    expect(getSender).toHaveBeenCalledWith(expect.objectContaining({ address: 'ffc.alerts' }))
  })

  test('should use topic option over config and env', async () => {
    init({ topic: 'configured.topic', connectionConfig: baseConnectionConfig })
    process.env.ALERT_TOPIC = 'env.topic'

    await createAlerts([{ message: 'test' }], 'test.type', { topic: 'option.topic' })

    expect(getSender).toHaveBeenCalledWith(expect.objectContaining({ address: 'option.topic' }))
  })

  test('should use connectionConfig option over configured config', async () => {
    init({ connectionConfig: { ...baseConnectionConfig, host: 'configured-host' } })

    await createAlerts([{ message: 'test' }], 'test.type', { connectionConfig: baseConnectionConfig })

    expect(getSender).toHaveBeenCalledWith(expect.objectContaining({ ...baseConnectionConfig, address: 'ffc.alerts' }))
  })

  test('should use configured connectionConfig when no option provided', async () => {
    init({ connectionConfig: baseConnectionConfig })

    await createAlerts([{ message: 'test' }], 'test.type')

    expect(getSender).toHaveBeenCalledWith(expect.objectContaining({ ...baseConnectionConfig, address: 'ffc.alerts' }))
  })

  test('should build connectionConfig from env when no config provided', async () => {
    process.env.MESSAGE_HOST = 'env-host.servicebus.windows.net'
    process.env.MESSAGE_USERNAME = 'env-user'
    process.env.MESSAGE_PASSWORD = 'env-password'

    await createAlerts([{ message: 'test' }], 'test.type')

    expect(getSender).toHaveBeenCalledWith(expect.objectContaining({
      host: 'env-host.servicebus.windows.net',
      username: 'env-user',
      password: 'env-password',
      address: 'ffc.alerts'
    }))

    delete process.env.MESSAGE_HOST
    delete process.env.MESSAGE_USERNAME
    delete process.env.MESSAGE_PASSWORD
  })

  test('should log error on publish failure', async () => {
    const loggerMock = { error: jest.fn() }
    const publishError = new Error('publish failed')
    sendBatchMessages.mockRejectedValueOnce(publishError)

    await expect(
      createAlerts([{ message: 'test' }], 'test.type', {
        connectionConfig: baseConnectionConfig,
        logger: loggerMock
      })
    ).rejects.toThrow('publish failed')

    expect(loggerMock.error).toHaveBeenCalledWith('Failed to publish alerts', publishError)
  })

  test('should filter out null alerts', async () => {
    await createAlerts([null, { message: 'test' }], 'test.type', { connectionConfig: baseConnectionConfig })

    const messages = sendBatchMessages.mock.calls[0][1]
    expect(messages).toHaveLength(1)
    expect(messages[0].body.data).toEqual({ message: 'test' })
  })

  test('should handle array with only null inputs', async () => {
    await createAlerts([null], 'type', { connectionConfig: baseConnectionConfig })
    expect(getSender).not.toHaveBeenCalled()
    expect(sendBatchMessages).not.toHaveBeenCalled()
  })

  test('should wrap alert in CloudEvent message body', async () => {
    await createAlerts([{ message: 'test' }], 'test.type', {
      source: 'test-source',
      connectionConfig: baseConnectionConfig
    })

    const messages = sendBatchMessages.mock.calls[0][1]
    const message = messages[0]
    expect(message.type).toBe('test.type')
    expect(message.source).toBe('test-source')
    expect(message.body).toMatchObject({
      specversion: '1.0',
      type: 'test.type',
      source: 'test-source',
      datacontenttype: 'text/json',
      data: { message: 'test' }
    })
    expect(message.body.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(message.body.time).toMatch(/\d{4}-\d{2}-\d{2}T/)
  })
})
