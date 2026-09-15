const index = require('../../app/index')

describe('index', () => {
  test('exports expected public api', () => {
    expect(Object.keys(index).sort()).toEqual([
      'closeSenders',
      'createAlerts',
      'dataProcessingAlert',
      'deriveAlertData',
      'init',
      'normalizeMessage',
      'sanitizeValue'
    ])
    expect(typeof index.init).toBe('function')
    expect(typeof index.createAlerts).toBe('function')
    expect(typeof index.dataProcessingAlert).toBe('function')
    expect(typeof index.deriveAlertData).toBe('function')
    expect(typeof index.normalizeMessage).toBe('function')
    expect(typeof index.sanitizeValue).toBe('function')
    expect(typeof index.closeSenders).toBe('function')
  })
})
