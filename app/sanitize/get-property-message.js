const { trimString } = require('./trim-string')

const getPropertyMessage = (object, propertyName) => {
  const propertyValue = object[propertyName]
  if (propertyValue == null) {
    return undefined
  }
  if (typeof propertyValue === 'string') {
    return trimString(propertyValue) || undefined
  }
  if (['number', 'boolean'].includes(typeof propertyValue)) {
    return String(propertyValue)
  }
  return undefined
}

module.exports = { getPropertyMessage }
