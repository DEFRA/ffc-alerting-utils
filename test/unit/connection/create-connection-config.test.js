const { createConnectionConfig } = require('../../../app/connection/create-connection-config')

describe('createConnectionConfig', () => {
  let originalEnv

  beforeAll(() => {
    originalEnv = { ...process.env }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  beforeEach(() => {
    delete process.env.MESSAGE_HOST
    delete process.env.MESSAGE_USERNAME
    delete process.env.MESSAGE_PASSWORD
    delete process.env.MESSAGE_CONNECTION_STRING
    delete process.env.MESSAGE_USE_CREDENTIAL_CHAIN
    delete process.env.MANAGED_IDENTITY_CLIENT_ID
    delete process.env.MESSAGE_USE_EMULATOR
  })

  test('should use connection string from env', () => {
    process.env.MESSAGE_CONNECTION_STRING = 'Endpoint=sb://env/;SharedAccessKeyName=...'

    const config = createConnectionConfig()

    expect(config.connectionString).toBe('Endpoint=sb://env/;SharedAccessKeyName=...')
  })

  test('should use credential chain from env', () => {
    process.env.MESSAGE_HOST = 'env-host.servicebus.windows.net'
    process.env.MESSAGE_USE_CREDENTIAL_CHAIN = 'true'

    const config = createConnectionConfig()

    expect(config.host).toBe('env-host.servicebus.windows.net')
    expect(config.useCredentialChain).toBe(true)
  })

  test('should use managed identity client id from env', () => {
    process.env.MESSAGE_HOST = 'env-host.servicebus.windows.net'
    process.env.MESSAGE_USE_CREDENTIAL_CHAIN = 'true'
    process.env.MANAGED_IDENTITY_CLIENT_ID = 'managed-id'

    const config = createConnectionConfig()

    expect(config.managedIdentityClientId).toBe('managed-id')
  })

  test('should use shared access signature from env', () => {
    process.env.MESSAGE_HOST = 'env-host.servicebus.windows.net'
    process.env.MESSAGE_USERNAME = 'env-user'
    process.env.MESSAGE_PASSWORD = 'env-password'

    const config = createConnectionConfig()

    expect(config.host).toBe('env-host.servicebus.windows.net')
    expect(config.username).toBe('env-user')
    expect(config.password).toBe('env-password')
  })

  test('should apply overrides over env values', () => {
    process.env.MESSAGE_HOST = 'env-host.servicebus.windows.net'
    process.env.MESSAGE_USERNAME = 'env-user'
    process.env.MESSAGE_PASSWORD = 'env-password'

    const config = createConnectionConfig({ host: 'override-host', username: 'override-user' })

    expect(config.host).toBe('override-host')
    expect(config.username).toBe('override-user')
    expect(config.password).toBe('env-password')
  })

  test('should remove undefined values', () => {
    const config = createConnectionConfig()

    expect(config).toEqual({
      useCredentialChain: false,
      useEmulator: false
    })
  })
})
