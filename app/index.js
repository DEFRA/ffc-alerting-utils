const DEFAULT_MESSAGE = 'An error occurred'
const SENSITIVE_KEY_PATTERN = /(password|pass|secret|token|key|credential|auth|api[_-]?key)/i
const REDACTED = '[REDACTED]'
const CIRCULAR = '[Circular]'
const MAX_SANITIZED_LENGTH = 200

const trimString = (value) => (typeof value === 'string' ? value.trim() : value)

let configuredTopic = null
let configuredSource = null
let configuredDefaultType = null

let configuredEventPublisherCtor = null

const init = ({ topic, source, defaultType, EventPublisherClass } = {}) => {
  if (topic) configuredTopic = topic
  if (source) configuredSource = source
  if (defaultType) configuredDefaultType = defaultType
  if (EventPublisherClass) configuredEventPublisherCtor = EventPublisherClass
}

const getPropertyMessage = (object, propertyName) => {
  if (!object || typeof object !== 'object') {
    return undefined
  }
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

const normalizeMessage = (input) => {
  if (input instanceof Error) {
    return trimString(input.message) || DEFAULT_MESSAGE
  }
  if (input == null) {
    return DEFAULT_MESSAGE
  }
  if (typeof input === 'string') {
    return trimString(input) || DEFAULT_MESSAGE
  }
  if (['number', 'boolean'].includes(typeof input)) {
    return String(input)
  }
  if (typeof input === 'object') {
    return getPropertyMessage(input, 'msg') || getPropertyMessage(input, 'message') || DEFAULT_MESSAGE
  }
  return DEFAULT_MESSAGE
}

const isSensitiveKey = (key) => !!(key && SENSITIVE_KEY_PATTERN.test(key))
const isTooLongString = (value) => typeof value === 'string' && value.length > MAX_SANITIZED_LENGTH
const isPrimitive = (value) => ['number', 'boolean'].includes(typeof value)
const isObject = (value) => typeof value === 'object' && value !== null

const sanitizeValue = (value, key, seen = new WeakSet()) => {
  if (isSensitiveKey(key)) {
    return REDACTED
  }

  if (isObject(value) && seen.has(value)) {
    return CIRCULAR
  }

  if (value == null) {
    return undefined
  }

  if (isTooLongString(value)) {
    return REDACTED
  }

  if (isPrimitive(value)) {
    return value
  }

  if (Array.isArray(value)) {
    return sanitizeArray(value, key, seen)
  }

  if (isObject(value)) {
    return sanitizeObject(value, seen)
  }

  return value
}

const sanitizeObject = (object, seen) => {
  if (seen.has(object)) {
    return CIRCULAR
  }
  seen.add(object)
  const sanitizedObject = {}
  Object.entries(object).forEach(([key, value]) => {
    const sanitized = sanitizeValue(value, key, seen)
    if (sanitized !== undefined) {
      sanitizedObject[key] = sanitized
    }
  })
  return Object.keys(sanitizedObject).length ? sanitizedObject : undefined
}

const sanitizeArray = (array, key, seen) => {
  if (seen.has(array)) {
    return CIRCULAR
  }
  seen.add(array)
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

const truncateStack = (stack, maxLines = 5) => {
  if (!stack) {
    return ''
  }
  const lines = String(stack).split('\n').map((line) => line.trim()).filter(Boolean)
  return lines.length ? lines.slice(0, maxLines).join('\n') : ''
}

const buildErrorData = (error) => {
  if (!error || typeof error !== 'object') {
    return {}
  }
  return {
    name: error.name,
    message: normalizeMessage(error),
    stack: truncateStack(error.stack)
  }
}

const looksLikeAlert = (obj) =>
  obj && typeof obj === 'object' &&
  (Object.prototype.hasOwnProperty.call(obj, 'source') ||
    Object.prototype.hasOwnProperty.call(obj, 'type') ||
    Object.prototype.hasOwnProperty.call(obj, 'data'))

const toAlert = (input, defaultType = undefined, options = {}) => {
  const defaultSource = options.source || configuredSource || process.env.ALERT_SOURCE || 'ffc-doc-alerting'

  if (!input && input !== 0) {
    return null
  }

  if (looksLikeAlert(input)) {
    const alert = {
      source: input.source || defaultSource,
      type: input.type || defaultType,
      data: input.data !== undefined ? input.data : sanitizeValue(input)
    }

    if (!alert.data) {
      const message = normalizeMessage(input)
      alert.data = { message }
    } else if (typeof alert.data === 'object') {
      if (!Object.prototype.hasOwnProperty.call(alert.data, 'message')) {
        alert.data.message = normalizeMessage(input)
      }
    }

    return alert
  }

  if (input instanceof Error) {
    return {
      source: defaultSource,
      type: defaultType,
      data: buildErrorData(input)
    }
  }

  const message = normalizeMessage(input)
  const data = sanitizeValue(input) || {}
  data.message = message
  return {
    source: defaultSource,
    type: defaultType,
    data
  }
}

const createAlerts = async (inputs, type, options = {}) => {
  const { EventPublisherClass, topic, logger = console } = options
  const EventPublisherCtor = EventPublisherClass || configuredEventPublisherCtor || (() => {
    return require('ffc-pay-event-publisher').EventPublisher
  })()

  const alertTopic = topic || configuredTopic || process.env.ALERT_TOPIC || 'ffc.alerts'

  const list = Array.isArray(inputs) ? inputs : [inputs]
  if (!list.length) {
    return
  }

  const alerts = list
    .map((item) => toAlert(item, type, options))
    .filter(Boolean)

  if (!alerts.length) {
    return
  }

  const eventPublisher = new EventPublisherCtor(alertTopic)
  try {
    await eventPublisher.publishEvents(alerts)
  } catch (err) {
    logger.error('Failed to publish alerts', err)
    throw err
  }
}

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

const needsMessage = (alertData) => {
  return (
    (!Object.hasOwn(alertData, 'message')) ||
    (alertData.message == null) ||
    (typeof alertData.message === 'string' && alertData.message.trim().length === 0)
  )
}

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

const deriveAlertData = (payload, processName) => {
  const alertData = { ...payload, process: processName }

  if (!needsMessage(alertData)) {
    return alertData
  }

  const maybeError = alertData.error
  const { message, clearError } = extractMessage(maybeError, processName)

  alertData.message = message
  if (clearError) {
    alertData.error = null
  }

  return alertData
}

const publish = async (alertPayloadArray, type, options = {}) => {
  const { throwOnPublishError = false, logger = console } = options
  try {
    await createAlerts(alertPayloadArray, type, options)
  } catch (err) {
    logger.error(`Failed to publish processing alert for ${alertPayloadArray?.[0]?.process ?? 'unknown'}`, err)
    if (throwOnPublishError) {
      throw err
    }
  }
}

const dataProcessingAlert = async (payload = {}, type, options = {}) => {
  const processName = validatePayload(payload)
  const { defaultType } = options
  const effectiveType = type ?? defaultType ?? configuredDefaultType ?? process.env.ALERT_TYPE ?? 'uk.gov.defra.ffc.doc.data.processing.error'
  const alertData = deriveAlertData(payload, processName)
  await publish([alertData], effectiveType, options)
}

module.exports = {
  init,
  createAlerts,
  dataProcessingAlert,
  deriveAlertData,
  normalizeMessage,
  sanitizeValue
}
