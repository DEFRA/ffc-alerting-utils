const { normalizeMessage } = require('../sanitize/normalize-message')

const ensureAlertDataHasMessage = (data, input) => {
  if (typeof data === 'object' && data !== null) {
    if (!Object.hasOwn(data, 'message')) {
      data.message = normalizeMessage(input)
    }
    return data
  }
  return { message: normalizeMessage(input) }
}

module.exports = { ensureAlertDataHasMessage }
