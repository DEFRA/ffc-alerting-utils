const { createEventMessage } = require('../../../app/publish/create-event-message')

describe('createEventMessage', () => {
  test('should wrap alert in CloudEvent body', () => {
    const alert = {
      source: 'ffc-doc-alerting',
      type: 'uk.gov.defra.ffc.doc.data.processing.error',
      data: { process: 'test', message: 'failed' }
    }

    const message = createEventMessage(alert)

    expect(message.type).toBe(alert.type)
    expect(message.source).toBe(alert.source)
    expect(message.body).toMatchObject({
      specversion: '1.0',
      type: alert.type,
      source: alert.source,
      datacontenttype: 'text/json',
      data: alert.data
    })
    expect(message.body.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(message.body.time).toMatch(/\d{4}-\d{2}-\d{2}T/)
  })
})
