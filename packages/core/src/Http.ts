/**
 * Options for {@link httpRequest}
 *
 * @public
 */
export interface HttpOptions {
  /**
   * Instance of an XMLHttpRequest to be used
   */
  xhr?: XMLHttpRequest
  /**
   * The target URL
   */
  url: string
  /**
   * The HTTP Method
   */
  type?: string
  /**
   * Indicates whether or not to perform the operation asynchronously
   */
  async?: boolean
  /**
   * The user name to use for authentication purposes
   */
  username?: string
  /**
   * The password to use for authentication purposes
   */
  password?: string
  /**
   * Headers to be added to the request
   */
  headers?: { [key: string]: string },
  /**
   * Query parameters or POST Data object to send
   */
  data?: any
}

function setXhrHeaders(xhr: XMLHttpRequest, headers: { [key: string]: string }) {
  if (!headers) { return }
  for (let key in headers) {
    if (headers.hasOwnProperty(key)) {
      xhr.setRequestHeader(key, headers[key])
    }
  }
}

function sendXhr(xhr: XMLHttpRequest, options: HttpOptions, async: boolean) {

  return new Promise<XMLHttpRequest>((resolve: any, reject: any) => {
    const complete = () => {
      if (200 <= xhr.status && xhr.status < 400) {
        resolve(xhr)
      } else {
        reject(xhr)
      }
    }
    if (!async) {
      xhr.send(options.data)
      complete()
      return
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        complete()
      }
    }
    xhr.send(options.data)
  })
}

/**
 * Creates and send an XMLHttpRequest
 *
 * @public
 * @param options - Request options
 */
export function httpRequest(options: HttpOptions): Promise<XMLHttpRequest> {
  const async = options.async === false ? false : true
  const xhr = options.xhr || new XMLHttpRequest()
  xhr.open(
    options.type || 'GET',
    options.url,
    async,
    options.username,
    options.password)
  setXhrHeaders(xhr, options.headers)
  return sendXhr(xhr, options, async)
}

export const Http = {
  createXMLHttpRequest: (responseType: XMLHttpRequestResponseType = 'text') => {
    const result = new XMLHttpRequest()
    result.responseType = responseType
    return result
  },
  request: httpRequest,
}
