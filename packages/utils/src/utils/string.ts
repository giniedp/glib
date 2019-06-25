/**
 * Removes leading and trailing spaces of a string
 *
 * @public
 */
export function trim(value: string): string {
  return value.replace(/(^\s*|\s*$)/g, '')
}

/**
 * Splits a string into lines
 *
 * @public
 */
export function getLines(value: string): string[] {
  return value.replace(/(\r\n)|\n/g, '\n').split('\n')
}

/**
 * Checks whether a value is a string
 *
 * @public
 */
export function isString(value: any): value is string {
  return typeof value === 'string'
}
