const messageSchema = require('../../../../app/messaging/service-bus/message-schema')

describe('messageSchema', () => {
  test('validates a valid message', async () => {
    const message = {
      body: { id: 1 },
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service'
    }

    await expect(messageSchema.validateAsync(message)).resolves.toBeTruthy()
  })

  test('allows null body', async () => {
    const message = {
      body: null,
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service'
    }

    await expect(messageSchema.validateAsync(message)).resolves.toBeTruthy()
  })

  test('rejects message without type', async () => {
    const message = {
      body: { id: 1 },
      source: 'ffc-demo-claim-service'
    }

    await expect(messageSchema.validateAsync(message)).rejects.toThrow('type')
  })

  test('rejects message without source', async () => {
    const message = {
      body: { id: 1 },
      type: 'uk.gov.demo.claim.validated'
    }

    await expect(messageSchema.validateAsync(message)).rejects.toThrow('source')
  })
})
