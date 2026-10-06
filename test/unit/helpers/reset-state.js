const {
  setConfiguredTopic,
  setConfiguredSource,
  setConfiguredDefaultType,
  setConfiguredConnectionConfig
} = require('../../../app/config/state')

const resetState = () => {
  setConfiguredTopic(null)
  setConfiguredSource(null)
  setConfiguredDefaultType(null)
  setConfiguredConnectionConfig(null)
}

module.exports = { resetState }
