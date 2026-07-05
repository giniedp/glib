const NAMED_STYLES = {
  // text color
  blue: 'color: #4E79A7',
  orange: 'color: #F28E2B',
  red: 'color: #E15759',
  teal: 'color: #76B7B2',
  green: 'color: #59A14F',
  yellow: 'color: #EDC948',
  purple: 'color: #B07AA1',
  pink: 'color: #FF9DA7',
  brown: 'color: #9C755F',
  gray: 'color: #BAB0AC',
  white: 'color:#fff',
  black: 'color:#000',
  // decoration
  bold: 'font-weight:bold',
  dim: 'opacity:0.5',
  italic: 'font-style:italic',
} as const

type NamedStyle = keyof typeof NAMED_STYLES

type LogMessage = [fmt: string, ...rest: unknown[]]

interface LogMethods {
  /**
   * Arbitrary text color
   * @example
   * lfmt.color("#ff6600")("msg")
   */
  color(value: string): LogChain
  /**
   * Arbitrary background color,
   * @example
   * lfmt.bg("navy")("msg")
   */
  bg(value: string): LogChain
  /**
   * Colored pill badge, pre-calculated for reuse.
   * @example
   * const tag = lfmt.badge("MyComponent", "#123")
   * console.log(...tag, "message")
   */
  badge(color: string, label: string): LogMessage
  /** Merges multiple LogMessage tuples into one, combining their format strings.
   *  Needed when composing two or more badges or styled segments as a prefix.
   *  const tag = lfmt.merge(lfmt.badge("App", "#4a9eff"), lfmt.badge("Auth", "#f1c40f"))
   *  console.log(...tag, "user logged in") */
  merge(...messages: LogMessage[]): LogMessage
}

// A chain node — callable to produce the final spread-ready array, chainable via properties
type LogChain = LogMethods & {
  readonly [K in NamedStyle]: LogChain
} & {
  (...args: unknown[]): LogMessage
}

function createChain(styles: string[]): LogChain {
  const css = () => styles.join(';')

  function call(...args: unknown[]): LogMessage {
    if (styles.length === 0) return args as LogMessage
    return [args.map(() => '%c%s').join(' '), ...args.flatMap((arg) => [css(), String(arg)])] as LogMessage
  }

  const methods: LogMethods = {
    color: (value: string) => createChain([...styles, `color:${value}`]),
    bg: (value: string) => createChain([...styles, `background:${value}`]),
    badge: (color: string, label: string): LogMessage => [
      `%c ${label} %c`,
      `background:${color};color:#fff;border-radius:3px;padding:2px 0px;font-weight:bold;font-size:0.85em`,
      'color:inherit;background:none',
    ],
    merge: (...messages: LogMessage[]): LogMessage => [
      messages.map((m) => m[0]).join(' '),
      ...messages.flatMap((m) => m.slice(1)),
    ],
  }

  return new Proxy(call, {
    get(_, prop: string) {
      if (prop in methods) {
        return methods[prop as keyof LogMethods]
      }
      if (prop in NAMED_STYLES) {
        return createChain([...styles, NAMED_STYLES[prop as NamedStyle]])
      }
      return undefined
    },
  }) as LogChain
}

export const lfmt: LogChain = createChain([])

// Usage examples:
//
// console.log(...lfmt.red.bold("[ERROR]", "something broke"))
// console.log(...lfmt.green("✓ ready"))
// console.log(...lfmt.dim("cache miss:", key))
// console.log(...lfmt.color("#e67e22").bold("custom color"))
// console.log(...lfmt.bg("navy").white.bold("[DB]"), rawQueryNotStyled)
//
// const tag = lfmt.badge("MyComponent", "#4a9eff")
// console.log(...tag, "message")
//
// const tag = lfmt.merge(lfmt.badge("App", "#4a9eff"), lfmt.badge("Auth", "#f1c40f"))
// console.log(...tag, "user logged in")
