const { publish } = require('../../../app/publish/publish')
const { createAlerts } = require('../../../app/publish/create-alerts')

jest.mock('../../../app/publish/create-alerts', () => ({
  createAlerts: jest.fn().mockResolvedValue()
}))

describe('publish', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call createAlerts with provided payload', async () => {
    await publish([{ process: 'test' }], 'test.type', { connectionConfig: { host: 'test' } })

    expect(createAlerts).toHaveBeenCalledWith([{ process: 'test' }], 'test.type', {
      connectionConfig: { host: 'test' }
    })
  })

  test('should not throw on publish error when throwOnPublishError is false', async () => {
    const loggerMock = { error: jest.fn() }
    createAlerts.mockRejectedValueOnce(new Error('publish failed'))

    await expect(
      publish([{ process: 'test' }], 'test.type', {
        throwOnPublishError: false,
        logger: loggerMock,
        connectionConfig: { host: 'test' }
      })
    ).resolves.not.toThrow()

    expect(loggerMock.error).toHaveBeenCalled()
  })

  test('should throw on publish error when throwOnPublishError is true', async () => {
    const loggerMock = { error: jest.fn() }
    createAlerts.mockRejectedValueOnce(new Error('publish failed'))

    await expect(
      publish([{ process: 'test' }], 'test.type', {
        throwOnPublishError: true,
        logger: loggerMock,
        connectionConfig: { host: 'test' }
      })
    ).rejects.toThrow('publish failed')
  })

  test('should log process name on publish error', async () => {
    const loggerMock = { error: jest.fn() }
    createAlerts.mockRejectedValueOnce(new Error('publish failed'))

    await publish([{ process: 'myProcess' }], 'test.type', {
      throwOnPublishError: false,
      logger: loggerMock,
      connectionConfig: { host: 'test' }
    })

    expect(loggerMock.error).toHaveBeenCalledWith(
      'Failed to publish processing alert for myProcess',
      expect.any(Error)
    )
  })

  test('should log unknown when process name is missing', async () => {
    const loggerMock = { error: jest.fn() }
    createAlerts.mockRejectedValueOnce(new Error('publish failed'))

    await publish([{}], 'test.type', {
      throwOnPublishError: false,
      logger: loggerMock,
      connectionConfig: { host: 'test' }
    })

    expect(loggerMock.error).toHaveBeenCalledWith(
      'Failed to publish processing alert for unknown',
      expect.any(Error)
    )
  })
})
