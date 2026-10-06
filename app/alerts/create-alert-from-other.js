const { normalizeMessage } = require('../sanitize/normalize-message')
const { sanitizeValue } = require('../sanitize/sanitize-value')

const createAlertFromOther = (input, defaultType, defaultSource) => {
  const message = normalizeMessage(input)
  const sanitized = sanitizeValue(input)
  const data = (typeof sanitized === 'object' && sanitized !== null) ? sanitized : {}
  data.message = message
  return {
    source: defaultSource,
    type: defaultType,
    data
  }
}

module.exports = { createAlertFromOther }
