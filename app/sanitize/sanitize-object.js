const { CIRCULAR } = require('../config/constants')

const sanitizeObject = (object, seen) => {
  if (seen.has(object)) {
    return CIRCULAR
  }
  seen.add(object)
  const { sanitizeValue } = require('./sanitize-value')
  const sanitizedObject = {}
  Object.entries(object).forEach(([key, value]) => {
    const sanitized = sanitizeValue(value, key, seen)
    if (sanitized !== undefined) {
      sanitizedObject[key] = sanitized
    }
  })
  return Object.keys(sanitizedObject).length ? sanitizedObject : undefined
}

module.exports = { sanitizeObject }
