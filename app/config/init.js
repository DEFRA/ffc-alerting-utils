const {
  setConfiguredTopic,
  setConfiguredSource,
  setConfiguredDefaultType,
  setConfiguredConnectionConfig
} = require('./state')

const init = ({ topic, source, defaultType, connectionConfig } = {}) => {
  if (topic) {
    setConfiguredTopic(topic)
  }
  if (source) {
    setConfiguredSource(source)
  }
  if (defaultType) {
    setConfiguredDefaultType(defaultType)
  }
  if (connectionConfig) {
    setConfiguredConnectionConfig(connectionConfig)
  }
}

module.exports = { init }
