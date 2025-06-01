
export function parseState(el: Element): State {
  return {
    name: el.tagName.toLowerCase(),
    value: el.textContent,
    param: el.getAttribute('param'),
    index: el.getAttribute('index'),
  }
}

export function parseStates(el: Element): States {
  const result: States = {}
  for (let i = 0; i < el.childNodes.length; i++) {
    const child = el.childNodes.item(i) as Element
    result[child.tagName.toLowerCase()] = parseState(child)
  }
  return result
}

export interface State {
  name: string
  value: string
  param: string
  index: string
}

export interface States {
  [key: string]: State
}
