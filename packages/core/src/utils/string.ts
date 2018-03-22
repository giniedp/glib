/**
 * @public
 */
export function trim(value: string): string {
  return value.replace(/(^\s*|\s*$)/g, '')
}

/**
 * @public
 */
export function getLines(value: string): string[] {
  return value.replace(/(\r\n)|\n/g, '\n').split('\n')
}

/**
 * @public
 */
export function isString(value: any): boolean {
  return typeof value === 'string'
}
