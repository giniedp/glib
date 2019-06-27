/**
 * A sampler function that takes a multi dimensional input value and returns a single value
 * @public
 */
export type Sampler = (...x: number[]) => number

/**
 * An easing function
 * @public
 */
export type Ease = (t: number) => number
