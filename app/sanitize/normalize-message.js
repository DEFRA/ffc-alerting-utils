const { DEFAULT_MESSAGE } = require('../config/constants')
const { trimString } = require('./trim-string')
const { getPropertyMessage } = require('./get-property-message')

const normalizeMessage = (input) => {
  if (input instanceof Error) {
    return trimString(input.message) || DEFAULT_MESSAGE
  }
  if (input == null) {
    return DEFAULT_MESSAGE
  }
  if (typeof input === 'string') {
    return trimString(input) || DEFAULT_MESSAGE
  }
  if (['number', 'boolean'].includes(typeof input)) {
    return String(input)
  }
  if (typeof input === 'object') {
    return getPropertyMessage(input, 'msg') || getPropertyMessage(input, 'message') || DEFAULT_MESSAGE
  }
  return DEFAULT_MESSAGE
}

module.exports = { normalizeMessage }
