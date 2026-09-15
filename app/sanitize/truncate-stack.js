const truncateStack = (stack, maxLines = 5) => {
  if (!stack) {
    return ''
  }
  const lines = String(stack).split('\n').map((line) => line.trim()).filter(Boolean)
  return lines.length ? lines.slice(0, maxLines).join('\n') : ''
}

module.exports = { truncateStack }
