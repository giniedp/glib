import { extend } from './utils'

export interface AjaxOptions {
  url: string
  type?: string
  async?: boolean
  username?: string
  password?: string
  headers?: { [key: string]: string }
}

function setXhrHeaders(xhr: XMLHttpRequest, headers: { [key: string]: string }) {
  if (!headers) { return }
  for (let key in headers) {
    if (headers.hasOwnProperty(key)) {
      xhr.setRequestHeader(key, headers[key])
    }
  }
}

function sendXhr(xhr: XMLHttpRequest, options: AjaxOptions, async: boolean) {

  return new Promise((resolve: any, reject: any) => {
    const complete = () => {
      if (!xhr.responseURL) {
        (xhr as any)['responseURL'] = xhr.responseURL || options.url
      }
      if (200 <= xhr.status && xhr.status < 400) {
        resolve(xhr)
      } else {
        reject(xhr)
      }
    }
    if (!async) {
      xhr.send(null)
      complete()
      return
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (!xhr.responseURL) {
          (xhr as any)['requestURL'] = options.url
        }
        complete()
      }
    }
    xhr.send(null)
  })
}

export function ajax(options: AjaxOptions): Promise<any> {
  if (Array.isArray(options.url)) {
    return Promise.all(options.url.map((url) => {
      return ajax(extend({ url: null }, options, {url: url}))
    }))
  }

  const async = options.async === false ? false : true
  const xhr = new XMLHttpRequest()
  xhr.open(
    options.type || 'GET',
    options.url,
    async,
    options.username,
    options.password)
  setXhrHeaders(xhr, options.headers)
  return sendXhr(xhr, options, async)
}
