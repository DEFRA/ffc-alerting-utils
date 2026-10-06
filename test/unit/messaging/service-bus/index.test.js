const serviceBus = require('../../../../app/messaging/service-bus')

describe('messaging/service-bus index', () => {
  test('exports expected service bus api', () => {
    expect(Object.keys(serviceBus).sort()).toEqual([
      'clearCache',
      'closeSenders',
      'createReceiver',
      'createServiceBusAdministrationClient',
      'createServiceBusClient',
      'enrichMessage',
      'getSender',
      'retry',
      'sendBatchMessages',
      'sendMessage',
      'subscribeReceiver'
    ])
    expect(typeof serviceBus.createServiceBusClient).toBe('function')
    expect(typeof serviceBus.createServiceBusAdministrationClient).toBe('function')
    expect(typeof serviceBus.enrichMessage).toBe('function')
    expect(typeof serviceBus.sendMessage).toBe('function')
    expect(typeof serviceBus.sendBatchMessages).toBe('function')
    expect(typeof serviceBus.createReceiver).toBe('function')
    expect(typeof serviceBus.subscribeReceiver).toBe('function')
    expect(typeof serviceBus.retry).toBe('function')
    expect(typeof serviceBus.getSender).toBe('function')
    expect(typeof serviceBus.closeSenders).toBe('function')
    expect(typeof serviceBus.clearCache).toBe('function')
  })
})
