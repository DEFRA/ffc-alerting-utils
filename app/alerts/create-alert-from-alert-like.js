const { sanitizeValue } = require('../sanitize/sanitize-value')
const { ensureAlertDataHasMessage } = require('./ensure-alert-data-has-message')

const createAlertFromAlertLike = (input, defaultType, defaultSource) => {
  const alert = {
    source: input.source || defaultSource,
    type: input.type || defaultType,
    data: input.data === undefined ? sanitizeValue(input) : input.data
  }
  alert.data = ensureAlertDataHasMessage(alert.data, input)
  return alert
}

module.exports = { createAlertFromAlertLike }
