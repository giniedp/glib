export interface HttpOptions {
  url: string
  type?: string
  async?: boolean
  username?: string
  password?: string
  headers?: { [key: string]: string },
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

  return new Promise((resolve: any, reject: any) => {
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

export const Http = {
  createXMLHttpRequest: () => new XMLHttpRequest(),
  request: <T = any>(options: HttpOptions): Promise<T> => {
    const async = options.async === false ? false : true
    const xhr = Http.createXMLHttpRequest()
    xhr.open(
      options.type || 'GET',
      options.url,
      async,
      options.username,
      options.password)
    setXhrHeaders(xhr, options.headers)
    return sendXhr(xhr, options, async)
  },
}
