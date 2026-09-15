const { getConfiguredTopic, getConfiguredConnectionConfig } = require('../config/state')
const { getSender } = require('../messaging/service-bus/sender-cache')
const { sendBatchMessages } = require('../messaging/service-bus/send-batch-messages')
const { createConnectionConfig } = require('../connection/create-connection-config')
const { toAlert } = require('../alerts/to-alert')
const { createEventMessage } = require('./create-event-message')

const createAlerts = async (inputs, type, options = {}) => {
  const { topic, connectionConfig: connectionConfigOverride, logger = console } = options
  const alertTopic = topic || getConfiguredTopic() || process.env.ALERT_TOPIC || 'ffc.alerts'

  const connectionConfig = connectionConfigOverride ||
    getConfiguredConnectionConfig() ||
    createConnectionConfig()

  const list = Array.isArray(inputs) ? inputs : [inputs]
  if (!list.length) {
    return
  }

  const alerts = list
    .map((item) => toAlert(item, type, options))
    .filter(Boolean)

  if (!alerts.length) {
    return
  }

  const messages = alerts.map(createEventMessage)
  const sender = getSender({ ...connectionConfig, address: alertTopic })

  try {
    await sendBatchMessages(sender, messages)
  } catch (err) {
    logger.error('Failed to publish alerts', err)
    throw err
  }
}

module.exports = { createAlerts }
