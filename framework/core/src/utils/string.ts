
export function trim(value: string): string {
  return value.replace(/(^\s*|\s*$)/g, '')
}

export function getLines(value: string): string[] {
  return value.replace(/(\r\n)|\n/g, '\n').split('\n')
}

export function chompLeft(value: string, prefix: string): string {
  if (value.indexOf(prefix) === 0) {
    return value.slice(prefix.length)
  } else {
    return value
  }
}

export function endsWith(value: string, suffix: string): boolean {
  return value.indexOf(suffix, value.length - suffix.length) !== -1
}

export function isString(value: any): boolean {
  return typeof value === 'string'
}
