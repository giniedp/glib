/**
 * Gets a value by key from an options object
 *
 * @public
 * @param options - The options object
 * @param key - The key to access
 * @param fallback - The fallback value
 * @returns the value behind the `key`. If the `key` is missing `fallback` is returned.
 */
export function getOption<T, V>(options: T, key: keyof T, fallback?: V): V {
  if (key in options) {
    return options[key] as any
  }
  return fallback
}
