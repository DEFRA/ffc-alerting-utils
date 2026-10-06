const { randomUUID } = require('node:crypto')

const createEventMessage = (alert) => ({
  body: {
    specversion: '1.0',
    type: alert.type,
    source: alert.source,
    id: randomUUID(),
    time: new Date().toISOString(),
    datacontenttype: 'text/json',
    data: alert.data
  },
  type: alert.type,
  source: alert.source
})

module.exports = { createEventMessage }
