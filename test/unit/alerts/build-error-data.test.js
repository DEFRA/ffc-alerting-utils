const { buildErrorData } = require('../../../app/alerts/build-error-data')

describe('buildErrorData', () => {
  test('should build error data with name, message and truncated stack', () => {
    const error = new Error('error message')
    const result = buildErrorData(error)

    expect(result.name).toBe('Error')
    expect(result.message).toBe('error message')
    expect(result.stack).toContain('Error: error message')
  })
})
