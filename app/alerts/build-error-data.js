const { normalizeMessage } = require('../sanitize/normalize-message')
const { truncateStack } = require('../sanitize/truncate-stack')

const buildErrorData = (error) => {
  return {
    name: error.name,
    message: normalizeMessage(error),
    stack: truncateStack(error.stack)
  }
}

module.exports = { buildErrorData }
