import { parseUri } from './parse'

/**
 * Parses the uri and returns the directory part without trailing slash
 *
 * @example
 * dirname('http://example.com/foo/bar/baz.png') // returns 'http://example.com/foo/bar'
 */
export function dirname(uri: string) {
  const result = parseUri(uri).directory
  if (result.endsWith('/') || result.endsWith('\\')) {
    return result.slice(0, -1)
  }
  return result
}

/**
 * Parses the uri and returns the filename part
 *
 * @example
 * filename('http://example.com/foo/bar/baz.png') // returns 'baz.png'
 */
export function filename(uri: string) {
  return parseUri(uri).filename || ''
}

/**
 * Parses the uri and returns the extension part with leading dot
 *
 * @example
 * extname('http://example.com/foo/bar/baz.png') // returns '.png'
 */
export function extname(uri: string) {
  const suffix = parseUri(uri).suffix
  return suffix ? `.${suffix}` : ''
}
