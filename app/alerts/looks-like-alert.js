const looksLikeAlert = (obj) =>
  obj &&
  typeof obj === 'object' &&
  (Object.hasOwn(obj, 'source') || Object.hasOwn(obj, 'type') || Object.hasOwn(obj, 'data'))

module.exports = { looksLikeAlert }
