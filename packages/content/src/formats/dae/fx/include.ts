export function parseInclude(el: Element): Include {
  return {
    sid: el.getAttribute('sid'),
    url: el.getAttribute('url'),
  }
}

/**
 * Imports source code or precompiled binary shaders into the FX Runtime by referencing an external resource.
 */
export interface Include {
  /**
   * Identifier for this source code block or binary shader
   */
  sid: string

  /**
   * Location where the resource can be found.
   */
  url: string
}
