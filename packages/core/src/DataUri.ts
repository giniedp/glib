// for explanation see:
// https://www.debuggex.com/
const regex = /^data:(([a-z0-9-]+\/[a-z0-9+-]+)?((;\s*([a-z0-9-]+=)?(([a-z0-9]+)|("[^"]*")))+)?)?\s*,(.*)$/

/**
 * Describes parts of a data Uri
 *
 * @public
 */
export class DataUri {
  /**
   * The original uri string
   */
  public uri: string
  /**
   * The detected content type
   */
  public contentType: string
  /**
   * Whether the uri contains base64 data
   */
  public isBase64: boolean
  /**
   * The data portion of the uri
   */
  public data: string

  /**
   * Checks whether a string represents a data uri
   *
   * @param uri - The Uri to check
   */
  public static isDataUri(uri: string): boolean {
    return regex.test(uri)
  }

  /**
   * Parses a uri into a data uri object
   *
   * @param uri - The Uri to parse
   */
  public static parse(uri: string): DataUri {
    if (!DataUri.isDataUri(uri)) {
      return {
        uri: uri,
        contentType: undefined,
        isBase64: false,
        data: undefined,
      }
    }
    const match = regex.exec(uri)
    return {
      uri: uri,
      contentType: match[1] || 'text/plain; charset=US-ASCII',
      isBase64: /;\s*base64$/.test(match[1] || ''),
      data: match[9],
    }
  }
}
