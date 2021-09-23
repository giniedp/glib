/**
 * Formats a webgl error message
 *
 * @remarks
 * Detects the line in the given source code where the given log message points to.
 * Returns the referenced portion of the soruce code
 *
 * @param log - the log message
 * @param source - the shader source code
 * @param n - number of leading and trailing lines to print
 * @returns
 */
export function formatError(log: string, source: string, n = 10): string {
  if (!log) {
    return ''
  }
  const sourceLines = source.split(/\n/)
  // ERROR: 0:335: '}' : syntax error
  const matcher = /^\s*(\w+)\s*:\s*(\d+)\s*:\s*(\d+)\s*:/
  const result: string[] = []
  for (const line of log.split('\n')) {
    result.push(line)
    const match = line.match(matcher)
    if (match) {
      const lineNum = Number(match[3]) - 1
      for (let i = lineNum - n; i < lineNum + n; i++) {
        if (i >= 0 && i < sourceLines.length) {
          let ln = String(i)
          ln = '     '.substring(0, 5 - ln.length) + ln
          if (i === lineNum) {
            ln = '>' + ln.substr(1)
          }
          result.push(`${ln}:  ${sourceLines[i]}`)
        }
      }
      continue
    }
  }
  return result.join('\n')
}
