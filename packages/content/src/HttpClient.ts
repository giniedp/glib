export type ResponseType = 'text' | 'json' | 'arraybuffer' | 'blob'
export interface HttpOptions<R extends ResponseType = null> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  headers?: Record<string, string>
  responseType?: R
  withCredentials?: boolean
  signal?: AbortSignal
}

export interface HttpResponse<T = any> {
  body: T | null
  status: number
  statusText: string
  headers: Headers
  contentType: string
  content: Uint8Array | null
}

export class HttpClient {
  /**
   * Default headers to be sent with each request
   */
  public headers: Record<string, string> = {}

  private disposed = false

  public dispose() {
    this.disposed = true
  }

  public async fetch(url: string, options: HttpOptions<'blob'>): Promise<HttpResponse<Blob>>
  public async fetch(url: string, options: HttpOptions<'arraybuffer'>): Promise<HttpResponse<ArrayBuffer>>
  public async fetch<T = any>(url: string, options: HttpOptions<'json'>): Promise<HttpResponse<T>>
  public async fetch(url: string, options: HttpOptions<'text'>): Promise<HttpResponse<string>>
  public async fetch(url: string, options?: HttpOptions): Promise<HttpResponse<unknown>>
  public async fetch(url: string, options: HttpOptions<any>): Promise<HttpResponse<unknown>> {
    const requestInit = this.createRequestInit(options)
    const response = await this.sendRequest(url, requestInit)
    if (!this.isSuccess(response)) {
      throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`)
    }
    const contentType = response.headers.get('Content-Type') || ''
    const content = await this.read(response, options?.signal)
    if (options?.signal?.aborted) {
      throw new Error('HTTP request was aborted')
    }
    const body = this.decode(options.responseType, content, contentType)
    return {
      body: body,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      contentType: contentType,
      content: content,
    }
  }

  protected sendRequest(url: string, requestInit: RequestInit): Promise<Response> {
    return fetch(url, requestInit)
  }

  protected isSuccess(response: Response): boolean {
    return response.status >= 200 && response.status < 300
  }

  protected createRequestInit(options: HttpOptions<any>): RequestInit {
    const headers: Record<string, string> = {}
    if (this.headers) {
      for (const key in this.headers) {
        headers[key] = this.headers[key]
      }
    }
    if (options.headers) {
      for (const key in options.headers) {
        headers[key] = options.headers[key]
      }
    }
    if (!('Accept' in headers)) {
      headers['Accept'] = `application/json, text/plain, */*`
    }

    return {
      method: options.method || 'GET',
      headers: headers,
      credentials: options.withCredentials ? 'include' : undefined,
      signal: options.signal,
    }
  }

  protected async read(response: Response, signal?: AbortSignal): Promise<Uint8Array> {
    if (!response.body) {
      return null
    }
    const chunks: Uint8Array[] = []
    const reader = response.body.getReader()

    let receivedLength = 0
    let canceled = false

    while (true) {
      if (this.disposed || signal?.aborted) {
        await reader.cancel()
        canceled = true
        break
      }

      const chunk = await reader.read()
      if (chunk.done) {
        break
      }

      chunks.push(chunk.value)
      receivedLength += chunk.value.length
      // TODO: report progress
    }

    return concatChunks(chunks, receivedLength)
  }

  public decode(
    type: ResponseType,
    content: Uint8Array,
    contentType: string,
  ): string | ArrayBuffer | Blob | object | null {
    switch (type) {
      case 'json':
        const text = new TextDecoder().decode(content)
        return text === '' ? null : (JSON.parse(text) as object)
      case 'text':
        return new TextDecoder().decode(content)
      case 'blob':
        return new Blob([content], { type: contentType })
      case 'arraybuffer':
        return content.buffer
    }
    return null
  }
}

export interface HttpResponse<T> {
  body: T | null
}

function concatChunks(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const chunksAll = new Uint8Array(totalLength)
  let position = 0
  for (const chunk of chunks) {
    chunksAll.set(chunk, position)
    position += chunk.length
  }
  return chunksAll
}
