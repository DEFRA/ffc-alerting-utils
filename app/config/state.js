let configuredTopic = null
let configuredSource = null
let configuredDefaultType = null
let configuredConnectionConfig = null

const getConfiguredTopic = () => configuredTopic
const getConfiguredSource = () => configuredSource
const getConfiguredDefaultType = () => configuredDefaultType
const getConfiguredConnectionConfig = () => configuredConnectionConfig

const setConfiguredTopic = (topic) => { configuredTopic = topic }
const setConfiguredSource = (source) => { configuredSource = source }
const setConfiguredDefaultType = (defaultType) => { configuredDefaultType = defaultType }
const setConfiguredConnectionConfig = (connectionConfig) => { configuredConnectionConfig = connectionConfig }

module.exports = {
  getConfiguredTopic,
  getConfiguredSource,
  getConfiguredDefaultType,
  getConfiguredConnectionConfig,
  setConfiguredTopic,
  setConfiguredSource,
  setConfiguredDefaultType,
  setConfiguredConnectionConfig
}
