// for explanation see:
// https://www.debuggex.com/
const regex = /(([a-z0-9-]+)\/([a-z0-9+-]+))?((;\s*([a-z0-9-]+=)?(([a-z0-9]+)|("[^"]*")))+)?/

export class ContentType {
  public mimeType: string
  public mediaType: string
  public subType: string
  public params?: string

  private static byExt: { [key: string]: ContentType[] } = {}
  private static byMime: { [key: string]: ContentType } = {}

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
