
export class DocumentCache {
  private map = {}
  public get<T>(key: string, orCreate: (key: string) => T): T {
    if (key in this.map) {
      return this.map[key]
    }
    const created = orCreate(key)
    this.map[key] = created
    return created
  }

  public mapChild<T>(key: string, el: Element, map: (el: Element) => T): T {
    return this.get(key, () => mapChild(el, key, map))
  }

  public mapChildren<T>(key: string, el: Element, map: (el: Element) => T): T[] {
    return this.get(key, () => mapChildren(el, key, map))
  }
}

/**
 * Returns the first child element with given tag name
 *
 * @param el the parent element
 * @param name the child name
 */
export function childWithTag(el: Element, name: string): Element {
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children.item(i)
    if (child && child.tagName === name) {
      return child
    }
  }
  return null
}

/**
 * Returns all child elements with given tag name
 *
 * @param el the parent element
 * @param name the child name
 */
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

/**
 * Selects the first child element matching the given tag name and passes it to
 * the given transform function and returns the result
 *
 * @param el the parent element
 * @param name the child name
 * @param transform the transform function
 */
export function mapChild<T>(element: Element, name: string | string[], transform: (child: Element) => T): T {
  if (!Array.isArray(name)) {
    const el = childWithTag(element, name)
    return el ? transform(el) : null
  }
  for (const n of name) {
    const el = childWithTag(element, n)
    if (el) {
      return transform(el)
    }
  }
  return null
}

/**
 * Selects all child elements matching the given tag name and passes each to
 * the given transform function and returns the result as an array
 *
 * @param el the parent element
 * @param name the child name
 * @param transform the transform function
 */
export function mapChildren<T = any>(el: Element, name: string, transform: (child: Element) => T): T[] {
  return childrenWithTag(el, name).map(transform)
}

/**
 * Selects the first element matching the given css selector and passes it to
 * the given transform function and returns the result
 *
 * @param element the parent element
 * @param selector the css selector
 * @param transform the transform function
 */
export function mapQuerySelector<T>(element: Element, selector: string, transform: (child: Element) => T): T {
  const el = element.querySelector(selector)
  return el ? transform(el) : null
}

/**
 * Selects all elements matching the given css selector passes each to
 * the given transform function and returns the result as an array
 *
 * @param element the parent element
 * @param selector the css selector
 * @param transform the transform function
 */
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

/**
 * Returns the `textContent` of given element
 *
 * @param el
 */
export function textContent(el: Element): string {
  return el.textContent
}

export function textContentToArray(el: Element): string[] {
  return el.textContent.trim().split(/\s+/)
}

export function textContentToNumber(el: Element): number {
  return Number(el.textContent.trim())
}

export function textContentToNumberArray(el: Element): number[] {
  return el.textContent.trim().split(/\s+/).map(Number)
}

export function textContentToBoolArray(el: Element): boolean[] {
  return el.textContent.trim().split(/\s+/).map((it) => it === 'true')
}

export function fromCache<T>(cache: any, key: string, create: (key: string) => T): T {
  if (cache[key] === undefined) {
    cache[key] = create(key)
  }
  return cache[key]
}

const simpleTypes = {
  bool: textContentToBoolArray,
  bool2: textContentToBoolArray,
  bool3: textContentToBoolArray,
  bool4: textContentToBoolArray,
  bool2x1: textContentToBoolArray,
  bool2x2: textContentToBoolArray,
  bool2x3: textContentToBoolArray,
  bool2x4: textContentToBoolArray,
  bool3x1: textContentToBoolArray,
  bool3x2: textContentToBoolArray,
  bool3x3: textContentToBoolArray,
  bool3x4: textContentToBoolArray,
  bool4x1: textContentToBoolArray,
  bool4x2: textContentToBoolArray,
  bool4x3: textContentToBoolArray,
  bool4x4: textContentToBoolArray,

  int: textContentToNumberArray,
  int2: textContentToNumberArray,
  int3: textContentToNumberArray,
  int4: textContentToNumberArray,
  int2x1: textContentToNumberArray,
  int2x2: textContentToNumberArray,
  int2x3: textContentToNumberArray,
  int2x4: textContentToNumberArray,
  int3x1: textContentToNumberArray,
  int3x2: textContentToNumberArray,
  int3x3: textContentToNumberArray,
  int3x4: textContentToNumberArray,
  int4x1: textContentToNumberArray,
  int4x2: textContentToNumberArray,
  int4x3: textContentToNumberArray,
  int4x4: textContentToNumberArray,

  float: textContentToNumberArray,
  float2: textContentToNumberArray,
  float3: textContentToNumberArray,
  float4: textContentToNumberArray,
  float2x1: textContentToNumberArray,
  float2x2: textContentToNumberArray,
  float2x3: textContentToNumberArray,
  float2x4: textContentToNumberArray,
  float3x1: textContentToNumberArray,
  float3x2: textContentToNumberArray,
  float3x3: textContentToNumberArray,
  float3x4: textContentToNumberArray,
  float4x1: textContentToNumberArray,
  float4x2: textContentToNumberArray,
  float4x3: textContentToNumberArray,
  float4x4: textContentToNumberArray,

  half: textContentToNumberArray,
  half2: textContentToNumberArray,
  half3: textContentToNumberArray,
  half4: textContentToNumberArray,
  half2x1: textContentToNumberArray,
  half2x2: textContentToNumberArray,
  half2x3: textContentToNumberArray,
  half2x4: textContentToNumberArray,
  half3x1: textContentToNumberArray,
  half3x2: textContentToNumberArray,
  half3x3: textContentToNumberArray,
  half3x4: textContentToNumberArray,
  half4x1: textContentToNumberArray,
  half4x2: textContentToNumberArray,
  half4x3: textContentToNumberArray,
  half4x4: textContentToNumberArray,

  fixed: textContentToNumberArray,
  fixed2: textContentToNumberArray,
  fixed3: textContentToNumberArray,
  fixed4: textContentToNumberArray,
  fixed2x1: textContentToNumberArray,
  fixed2x2: textContentToNumberArray,
  fixed2x3: textContentToNumberArray,
  fixed2x4: textContentToNumberArray,
  fixed3x1: textContentToNumberArray,
  fixed3x2: textContentToNumberArray,
  fixed3x3: textContentToNumberArray,
  fixed3x4: textContentToNumberArray,
  fixed4x1: textContentToNumberArray,
  fixed4x2: textContentToNumberArray,
  fixed4x3: textContentToNumberArray,
  fixed4x4: textContentToNumberArray,

  bvec2: textContentToBoolArray,
  bvec3: textContentToBoolArray,
  bvec4: textContentToBoolArray,

  ivec2: textContentToNumberArray,
  ivec3: textContentToNumberArray,
  ivec4: textContentToNumberArray,

  vec2: textContentToNumberArray,
  vec3: textContentToNumberArray,
  vec4: textContentToNumberArray,

  mat2: textContentToNumberArray,
  mat3: textContentToNumberArray,
  mat4: textContentToNumberArray,
}

export function parseSimpleType(el: Element) {
  const name = el.tagName
  const parser = simpleTypes[name]
  return {
    type: name,
    value: parser ? parser(el) : el.textContent,
  }
}

export function mapChildSimpleType(el: Element) {
  return mapChild(el, Object.keys(simpleTypes), parseSimpleType)
}
