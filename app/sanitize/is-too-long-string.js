const { MAX_SANITIZED_LENGTH } = require('../config/constants')

const isTooLongString = (value) => typeof value === 'string' && value.length > MAX_SANITIZED_LENGTH

module.exports = { isTooLongString }
