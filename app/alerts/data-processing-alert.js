const { getConfiguredDefaultType } = require('../config/state')
const { validatePayload } = require('./validate-payload')
const { deriveAlertData } = require('./derive-alert-data')
const { publish } = require('../publish/publish')

const dataProcessingAlert = async (payload, type, options = {}) => {
  const processName = validatePayload(payload)
  const { defaultType } = options
  const effectiveType = type ?? defaultType ?? getConfiguredDefaultType() ?? process.env.ALERT_TYPE ?? 'uk.gov.defra.ffc.doc.data.processing.error'
  const alertData = deriveAlertData(payload, processName)
  await publish([alertData], effectiveType, options)
}

module.exports = { dataProcessingAlert }
