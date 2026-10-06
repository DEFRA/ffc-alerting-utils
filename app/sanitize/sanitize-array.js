const { CIRCULAR } = require('../config/constants')

const sanitizeArray = (array, key, seen) => {
  if (seen.has(array)) {
    return CIRCULAR
  }
  seen.add(array)
  const { sanitizeValue } = require('./sanitize-value')
  const sanitizedArray = array
    .map((item) => sanitizeValue(item, key, seen))
    .filter((item) => {
      if (item === undefined || item === null) {
        return false
      }
      if (typeof item === 'string' && item.trim() === '') {
        return false
      }
      return true
    })
  return sanitizedArray.length ? sanitizedArray : undefined
}

module.exports = { sanitizeArray }
