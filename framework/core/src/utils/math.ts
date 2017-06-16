
/**
 * Tests whether the given number is positive and is a power of two value
 * @method isPowerOfTwo
 * @param {number} value The number to test
 * @return {boolean}
 */
export function isPowerOfTwo(value: number): boolean {
  return ((value > 0) && !(value & (value - 1))) // tslint:disable-line
}

/**
 * @method lowerPowerOfTwo
 * @param value
 * @returns {number}
 */
export function lowerPowerOfTwo(value: number): number {
  if (value <= 2) {
    throw new Error('value must not be smaller than 2')
  }
  let i = 1
  while (i < value) {
    i *= 2
  }
  return i
}

/**
 * @method higherPowerOfTwo
 * @param value
 * @returns {number}
 */
export function higherPowerOfTwo(value: number): number {
  if (value <= 2) {
    return 2
  }
  let i = 1
  while (i <= value) {
    i *= 2
  }
  return i
}

/**
 * @method highestBit
 * @param value
 * @returns {number}
 */
export function highestBit(value: number): number {
  if (value <= 0) {
    return -1
  }

  let index = 0
  let pow = 1
  while (pow <= value) {
    pow *= 2
    index += 1
  }
  return index - 1
}
