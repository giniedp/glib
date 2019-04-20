export function parseCode(el: Element): Code {
  return {
    sid: el.getAttribute('sid'),
    content: el.textContent,
  }
}

export interface Code {
  /**
   * A text string value containing the scoped identifier of this element.
   * This value must be unique within the scope of the parent element.
   */
  sid: string

  /**
   * The source code
   */
  content: string
}
