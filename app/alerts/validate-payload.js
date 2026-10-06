const validatePayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new TypeError('payload must be an object with at least a `process` property')
  }
  const processName = payload.process
  if (!processName || typeof processName !== 'string') {
    throw new TypeError('payload.process (string) is required')
  }
  return processName
}

module.exports = { validatePayload }
