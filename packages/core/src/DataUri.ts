// for explanation see:
// https://www.debuggex.com/
const regex = /^data:(([a-z0-9-]+\/[a-z0-9+-]+)?((;\s*([a-z0-9-]+=)?(([a-z0-9]+)|("[^"]*")))+)?)?\s*,(.*)$/

export class DataUri {
  public uri: string
  public contentType: string
  public isBase64: boolean
  public data: string

  public static isDataUri(uri: string): boolean {
    return regex.test(uri)
  }

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
