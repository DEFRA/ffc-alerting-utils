const { getConfiguredSource } = require('../config/state')
const { looksLikeAlert } = require('./looks-like-alert')
const { createAlertFromAlertLike } = require('./create-alert-from-alert-like')
const { createAlertFromError } = require('./create-alert-from-error')
const { createAlertFromOther } = require('./create-alert-from-other')

const toAlert = (input, defaultType = undefined, options = {}) => {
  const defaultSource = options.source || getConfiguredSource() || process.env.ALERT_SOURCE || 'ffc-doc-alerting'

  if (!(input || input === 0)) {
    return null
  }

  if (looksLikeAlert(input)) {
    return createAlertFromAlertLike(input, defaultType, defaultSource)
  }

  if (input instanceof Error) {
    return createAlertFromError(input, defaultType, defaultSource)
  }

  return createAlertFromOther(input, defaultType, defaultSource)
}

module.exports = { toAlert }
