const extractMessage = (maybeError, processName) => {
  if (maybeError instanceof Error) {
    return { message: maybeError.message || `Failed processing ${processName}`, clearError: false }
  }

  if (typeof maybeError === 'object' && maybeError != null && typeof maybeError.message === 'string') {
    return { message: maybeError.message, clearError: false }
  }

  if (typeof maybeError === 'string') {
    return { message: maybeError, clearError: true }
  }

  return { message: `Failed processing ${processName}`, clearError: false }
}

module.exports = { extractMessage }
