const createConnectionConfig = (overrides = {}) => {
  const config = {
    host: process.env.MESSAGE_HOST,
    username: process.env.MESSAGE_USERNAME,
    password: process.env.MESSAGE_PASSWORD,
    connectionString: process.env.MESSAGE_CONNECTION_STRING,
    useCredentialChain: process.env.MESSAGE_USE_CREDENTIAL_CHAIN === 'true',
    managedIdentityClientId: process.env.MANAGED_IDENTITY_CLIENT_ID,
    useEmulator: process.env.MESSAGE_USE_EMULATOR === 'true',
    ...overrides
  }

  return Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined)
  )
}

module.exports = { createConnectionConfig }
