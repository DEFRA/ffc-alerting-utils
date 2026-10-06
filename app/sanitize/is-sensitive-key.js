const { SENSITIVE_KEY_PATTERN } = require('../config/constants')

const isSensitiveKey = (key) => !!(key && SENSITIVE_KEY_PATTERN.test(key))

module.exports = { isSensitiveKey }
