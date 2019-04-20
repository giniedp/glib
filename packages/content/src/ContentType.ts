// for explanation see:
// https://www.debuggex.com/
const regex = /(([a-z0-9-]+)\/([a-z0-9+-]+))?((;\s*([a-z0-9-]+=)?(([a-z0-9]+)|("[^"]*")))+)?/

/**
 * Describes components of a mime type
 */
export class ContentType {
  /**
   * The mime type string e.g. text/json
   */
  public mimeType: string

  /**
   * The media type of a mime type e.g. 'text'
   */
  public mediaType: string

  /**
   * The sub type of a mime type e.g. 'json'
   */
  public subType: string

  /**
   * The params of a mime type
   */
  public params?: string

  public static parse(input: string): ContentType {
    const match: any[] = regex.exec(input) || []
    return match ? {
      mimeType: match[1],
      mediaType: match[2],
      subType: match[3],
      params: (match[4] || ''),
    } : null
  }
}
