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

 Usage per-service:

 In the app index (recommended), you can init the alerting by using a solution similar to the following in statement-constructor :

 const alerting = require('ffc-alerting-utils')
const messageConfig = require('./config/message')
const { SOURCE } = require('./constants/source')
const { DATA_PROCESSING_ERROR } = require('./constants/alerts')
const { EventPublisher } = require('ffc-pay-event-publisher')

if (alerting.init) {
  alerting.init({
    topic: messageConfig.alertTopic,
    source: SOURCE,
    defaultType: DATA_PROCESSING_ERROR,
    EventPublisherClass: EventPublisher
  })
}



## Licence
THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3

The following attribution statement MUST be cited in your products and applications when using this information.

Contains public sector information licensed under the Open Government license v3

About the licence
The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.