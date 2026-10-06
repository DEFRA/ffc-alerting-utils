const { toAlert } = require('../../../app/alerts/to-alert')
const { resetState } = require('../helpers/reset-state')

describe('toAlert', () => {
  beforeEach(() => {
    resetState()
    delete process.env.ALERT_SOURCE
  })

  afterEach(() => {
    delete process.env.ALERT_SOURCE
  })

  test('should return null for falsy input except 0', () => {
    expect(toAlert(null, 'type')).toBeNull()
    expect(toAlert(undefined, 'type')).toBeNull()
    expect(toAlert('', 'type')).toBeNull()
  })

  test('should handle input 0', () => {
    const alert = toAlert(0, 'type')
    expect(alert).not.toBeNull()
    expect(alert.data.message).toBe('0')
  })

  test('should handle looksLikeAlert input with only data', () => {
    const alert = toAlert({ data: { message: 'test' } }, 'type')
    expect(alert.data).toEqual({ message: 'test' })
  })

  test('should handle looksLikeAlert input with empty data object', () => {
    const alert = toAlert({ source: 'custom', data: {} }, 'type')
    expect(alert.data).toEqual({ message: 'An error occurred' })
  })

  test('should handle looksLikeAlert input with null data', () => {
    const alert = toAlert({ source: 'custom', type: 't', data: null }, 'fallback')
    expect(alert.data).toEqual({ message: 'An error occurred' })
  })

  test('should handle looksLikeAlert input with source', () => {
    const alert = toAlert({ source: 'custom', data: { message: 'test' } }, 'type')
    expect(alert.source).toBe('custom')
  })

  test('should handle looksLikeAlert input with type', () => {
    const alert = toAlert({ type: 'custom', data: { message: 'test' } }, 'fallback')
    expect(alert.type).toBe('custom')
  })

  test('should handle Error input', () => {
    const alert = toAlert(new Error('error'), 'type')
    expect(alert.data.message).toBe('error')
  })

  test('should use configured source as default', () => {
    const { setConfiguredSource } = require('../../../app/config/state')
    setConfiguredSource('configured-source')
    const alert = toAlert('string', 'type')
    expect(alert.source).toBe('configured-source')
  })

  test('should use env source as default', () => {
    process.env.ALERT_SOURCE = 'env-source'
    const alert = toAlert('string', 'type')
    expect(alert.source).toBe('env-source')
  })

  test('should use fallback source when no overrides', () => {
    const alert = toAlert('string', 'type')
    expect(alert.source).toBe('ffc-doc-alerting')
  })

  test('should use options source over configured and env', () => {
    process.env.ALERT_SOURCE = 'env-source'
    const { setConfiguredSource } = require('../../../app/config/state')
    setConfiguredSource('configured-source')
    const alert = toAlert('string', 'type', { source: 'options-source' })
    expect(alert.source).toBe('options-source')
  })
})
