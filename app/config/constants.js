const DEFAULT_MESSAGE = 'An error occurred'
const SENSITIVE_KEY_PATTERN = /(password|pass|secret|token|key|credential|auth|api[_-]?key)/i
const REDACTED = '[REDACTED]'
const CIRCULAR = '[Circular]'
const MAX_SANITIZED_LENGTH = 200

module.exports = {
  DEFAULT_MESSAGE,
  SENSITIVE_KEY_PATTERN,
  REDACTED,
  CIRCULAR,
  MAX_SANITIZED_LENGTH
}
