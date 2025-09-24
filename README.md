# ffc-alerting-utils

Small shared alerting utility used by FFC services.

Install:
- As a private npm package: `npm i @your-org/ffc-alerting-utils`
- Or as a git dependency: `npm i git+ssh://git@.../ffc-alerting-utils.git#v0.1.0`
- Or during development: use `npm link` (see below).

Usage:
const { dataProcessingAlert } = require('ffc-alerting-utils')

dataProcessingAlert(payload, DATA_PROCESSING_ERROR)
  .catch(err => console.error('alert failed', err))

Options:
- createAlerts(inputs, type, { EventPublisherClass, topic, logger })
- dataProcessingAlert(payload, type, { defaultType, EventPublisherClass, topic, logger, throwOnPublishError })


 Exports:
 - createAlerts(inputs, type, options)
 - dataProcessingAlert(payload, type, options)
 
  options:
 - EventPublisherClass: class to instantiate publisher (defaults to ffc-pay-event-publisher EventPublisher)
 - topic: topic string (defaults to process.env.ALERT_TOPIC)
 - logger: object with .error/.info (defaults to console)
 - throwOnPublishError: boolean (passed through to dataProcessingAlert)