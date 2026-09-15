const { REDACTED, CIRCULAR } = require('../config/constants')
const { isSensitiveKey } = require('./is-sensitive-key')
const { isTooLongString } = require('./is-too-long-string')
const { isPrimitive } = require('./is-primitive')
const { isObject } = require('./is-object')
const { sanitizeObject } = require('./sanitize-object')
const { sanitizeArray } = require('./sanitize-array')

const sanitizeValue = (value, key, seen = new WeakSet()) => {
  if (isSensitiveKey(key)) {
    return REDACTED
  }

  if (isObject(value) && seen.has(value)) {
    return CIRCULAR
  }

  if (value == null) {
    return undefined
  }

  if (isTooLongString(value)) {
    return REDACTED
  }

  if (isPrimitive(value)) {
    return value
  }

  if (Array.isArray(value)) {
    return sanitizeArray(value, key, seen)
  }

  if (isObject(value)) {
    return sanitizeObject(value, seen)
  }

  return value
}

module.exports = { sanitizeValue }
