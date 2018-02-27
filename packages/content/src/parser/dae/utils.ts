export function childWithTag(el: Element, name: string): Element {
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children.item(i)
    if (child && child.tagName === name) {
      return child
    }
  }
  return null
}

export function childrenWithTag(el: Element, name: string): Element[] {
  const result: Element[] = []
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children.item(i)
    if (child && child.tagName === name) {
      result.push(child)
    }
  }
  return result
}

export function textOfChild(element: Element, name: string): string {
  const el = childWithTag(element, name)
  return el ? el.textContent : null
}

export function mapChildren<T = any>(el: Element, name: string, transform: (child: Element) => T): T[] {
  return childrenWithTag(el, name).map(transform)
}

export function mapChild<T>(element: Element, name: string, transform: (child: Element) => T): T {
  const el = childWithTag(element, name)
  return el ? transform(el) : null
}

export function mapQuerySelector<T>(element: Element, selector: string, transform: (child: Element) => T): T {
  const el = element.querySelector(selector)
  return el ? transform(el) : null
}

export function mapQuerySelectorAll<T>(element: Element, selector: string, transform: (child: Element) => T): T[] {
  const result: T[] = []
  const el = element.querySelectorAll(selector)
  for (let i = 0; i < el.length; i++) {
    result.push(transform(el.item(i)))
  }
  return result
}

export function escapeUriFragment(fragment: string): string {
  if (fragment.length > 1) {
    return fragment[0] + fragment.substring(1).replace(/[!"#$%&'()*+,-.\/\\:;<=>?@\[\]^`{|}~]/gi, (token) => `\\${token}`)
  }
  return fragment
}

export function textContentToArray(el: Element): string[] {
  return el.textContent.trim().split(/\s+/)
}

export function textContentToNumberArray(el: Element): number[] {
  return el.textContent.trim().split(/\s+/).map(Number)
}

export function fromCache<T>(cache: any, key: string, create: () => T): T {
  if (cache[key] === undefined) {
    cache[key] = create()
  }
  return cache[key]
}
