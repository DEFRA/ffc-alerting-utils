const { needsMessage } = require('./needs-message')
const { extractMessage } = require('./extract-message')

const deriveAlertData = (payload, processName) => {
  const alertData = { ...payload, process: processName }

  if (!needsMessage(alertData)) {
    return alertData
  }

  const maybeError = alertData.error
  const { message, clearError } = extractMessage(maybeError, processName)

  alertData.message = message
  if (clearError) {
    alertData.error = null
  }

  return alertData
}

module.exports = { deriveAlertData }
