const state = require('../../../app/config/state')

describe('state', () => {
  beforeEach(() => {
    state.setConfiguredTopic(null)
    state.setConfiguredSource(null)
    state.setConfiguredDefaultType(null)
    state.setConfiguredConnectionConfig(null)
  })

  test('topic defaults to null', () => {
    expect(state.getConfiguredTopic()).toBeNull()
  })

  test('sets and gets topic', () => {
    state.setConfiguredTopic('test.topic')
    expect(state.getConfiguredTopic()).toBe('test.topic')
  })

  test('source defaults to null', () => {
    expect(state.getConfiguredSource()).toBeNull()
  })

  test('sets and gets source', () => {
    state.setConfiguredSource('test-source')
    expect(state.getConfiguredSource()).toBe('test-source')
  })

  test('defaultType defaults to null', () => {
    expect(state.getConfiguredDefaultType()).toBeNull()
  })

  test('sets and gets defaultType', () => {
    state.setConfiguredDefaultType('test.type')
    expect(state.getConfiguredDefaultType()).toBe('test.type')
  })

  test('connectionConfig defaults to null', () => {
    expect(state.getConfiguredConnectionConfig()).toBeNull()
  })

  test('sets and gets connectionConfig', () => {
    const config = { host: 'test.servicebus.windows.net' }
    state.setConfiguredConnectionConfig(config)
    expect(state.getConfiguredConnectionConfig()).toBe(config)
  })
})
