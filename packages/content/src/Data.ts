import { DataUri } from '@gglib/utils'
import { ContentType } from './ContentType'

 /**
  * @public
  */
export interface Data<T = string | ArrayBuffer | Blob | Document | any> {
  /**
   * The source url
   */
  source: string
  /**
   * The content
   */
  content: T
  /**
   * The content type (e.g. application/json)
   */
  type?: ContentType
}

/**
 * @public
 */
export function dataFromXhr(xhr: XMLHttpRequest) {
  return {
    xhr: xhr,
    source: xhr.responseURL,
    content: xhr.response || xhr.responseText,
    type: ContentType.parse(xhr.getResponseHeader('content-type')),
  }
}

/**
 * @public
 */
export function dataFromUri(uri: DataUri): Data<string> {
  return {
    source: uri.uri,
    content: uri.data,
    type: ContentType.parse(uri.contentType),
  }
}

/**
 * @public
 */
export function dataFromElement<T = string>(path: string, el: Element, convert = (it: string): T => it as any): Data<T> {
  return {
    source: path,
    type: ContentType.parse(el.getAttribute('type')),
    content: convert(el.textContent),
  }
}
