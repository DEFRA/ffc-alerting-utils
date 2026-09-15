const needsMessage = (alertData) =>
  !Object.hasOwn(alertData, 'message') ||
  alertData.message == null ||
  (typeof alertData.message === 'string' && alertData.message.trim().length === 0)

module.exports = { needsMessage }
