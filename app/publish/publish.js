const { createAlerts } = require('./create-alerts')

const publish = async (alertPayloadArray, type, options = {}) => {
  const { throwOnPublishError = false, logger = console } = options
  try {
    await createAlerts(alertPayloadArray, type, options)
  } catch (err) {
    logger.error(`Failed to publish processing alert for ${alertPayloadArray?.[0]?.process ?? 'unknown'}`, err)
    if (throwOnPublishError) {
      throw err
    }
  }
}

module.exports = { publish }
