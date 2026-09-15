const { buildErrorData } = require('./build-error-data')

const createAlertFromError = (input, defaultType, defaultSource) => ({
  source: defaultSource,
  type: defaultType,
  data: buildErrorData(input)
})

module.exports = { createAlertFromError }
