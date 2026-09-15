const { init } = require('../../../app/config/init')
const state = require('../../../app/config/state')
const { createAlerts } = require('../../../app/publish/create-alerts')
const { dataProcessingAlert } = require('../../../app/alerts/data-processing-alert')
const { sendBatchMessages } = require('../../../app/messaging/service-bus/send-batch-messages')
const { getSender } = require('../../../app/messaging/service-bus/sender-cache')

jest.mock('../../../app/messaging/service-bus/send-batch-messages', () => ({
  sendBatchMessages: jest.fn().mockResolvedValue()
}))

jest.mock('../../../app/messaging/service-bus/sender-cache', () => ({
  getSender: jest.fn(),
  closeSenders: jest.fn().mockResolvedValue(),
  clearCache: jest.fn()
}))

const connectionConfig = {
  host: 'test.servicebus.windows.net',
  username: 'RootManageSharedAccessKey',
  password: 'test-key'
}

describe('init', () => {
  let originalEnv

  beforeAll(() => {
    originalEnv = { ...process.env }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  beforeEach(() => {
    jest.clearAllMocks()
    state.setConfiguredTopic(null)
    state.setConfiguredSource(null)
    state.setConfiguredDefaultType(null)
    state.setConfiguredConnectionConfig(null)
    delete process.env.ALERT_TOPIC
    delete process.env.ALERT_SOURCE
    delete process.env.ALERT_TYPE
    getSender.mockReturnValue({ name: 'sender' })
  })

  test('should set topic when provided', async () => {
    init({ topic: 'test.topic', connectionConfig })
    await createAlerts([{ message: 'test' }], 'type')
    expect(getSender).toHaveBeenCalledWith(expect.objectContaining({ address: 'test.topic' }))
  })

  test('should set source when provided', async () => {
    init({ source: 'test-source', connectionConfig })
    await createAlerts('test', 'type')
    const messages = sendBatchMessages.mock.calls[0][1]
    const alert = messages[0]
    expect(alert.source).toBe('test-source')
  })

  test('should set defaultType when provided', async () => {
    init({ defaultType: 'test.type', connectionConfig })
    await dataProcessingAlert({ process: 'test' }, undefined)
    expect(sendBatchMessages).toHaveBeenCalled()
    const messages = sendBatchMessages.mock.calls[0][1]
    expect(messages[0].type).toBe('test.type')
  })

  test('should set connectionConfig when provided', async () => {
    init({ connectionConfig })
    await createAlerts([{ message: 'test' }], 'type')
    expect(getSender).toHaveBeenCalledWith(expect.objectContaining(connectionConfig))
  })

  test('should handle partial config', () => {
    init({ topic: 'partial.topic', connectionConfig })
    expect(state.getConfiguredTopic()).toBe('partial.topic')
  })

  test('should not set topic when falsy', async () => {
    init({ topic: '', connectionConfig })
    process.env.ALERT_TOPIC = 'env.topic'
    await createAlerts([{ message: 'test' }], 'type')
    expect(getSender).toHaveBeenCalledWith(expect.objectContaining({ address: 'env.topic' }))
  })
})
