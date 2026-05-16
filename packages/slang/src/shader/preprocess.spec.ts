import { describe, expect, it, test } from 'vitest'
import { preprocess, preprocessor } from './preprocess'
import { printTokens } from './print'
import { tokenize } from './tokenize'

function tokenizeFn(code: string) {
  return tokenize(code, {
    comment: null,
    number: null,
    keywords: new Set(),
    symbols: '-,;:!?.()[]{}@*/&%^+<=>|~',
  })
}

describe('preprocessor', () => {
  it('#define x', () => {
    const state = preprocessor()
    expect(state.has('x')).toBe(false)
    expect(state.get('x')).toBe(undefined)

    state.process('define x')
    expect(state.has('x')).toBe(true)
    expect(state.get('x')).toBe('')
  })

  it('#define x y', () => {
    const state = preprocessor()
    state.process('define x y')
    expect(state.has('x')).toBe(true)
    expect(state.get('x')).toBe('y')
  })

  it('#undef x', () => {
    const state = preprocessor()
    state.process('define x')
    expect(state.has('x')).toBe(true)
    expect(state.get('x')).toBe('')
    state.process('undef x')
    expect(state.has('x')).toBe(false)
    expect(state.get('x')).toBe(undefined)
  })

  it('#ifdef x', () => {
    const state = preprocessor()
    state.process('ifdef x')
    expect(state.active()).toBe(false)
    state.process('endif')

    state.process('ifdef x')
    expect(state.active()).toBe(false)
    state.process('else')
    expect(state.active()).toBe(true)
    state.process('endif')

    state.process('define x')
    state.process('ifdef x')
    expect(state.active()).toBe(true)
    state.process('endif')

    state.process('ifdef x')
    expect(state.active()).toBe(true)
    state.process('else')
    expect(state.active()).toBe(false)
    state.process('endif')

    state.process('ifdef a')
    state.process('define b')
    state.process('else')
    state.process('define c')
    state.process('endif')
    expect(state.has('a')).toBe(false)
    expect(state.has('b')).toBe(false)
    expect(state.has('c')).toBe(true)
  })

  it('#ifndef x', () => {
    const state = preprocessor()
    state.process('ifndef x')
    expect(state.active()).toBe(true)
    state.process('endif')

    state.process('define x')
    state.process('ifndef x')
    expect(state.active()).toBe(false)
    state.process('endif')
  })

  const tests = [
    {
      name: 'ifdef',
      input: `
      #define bar
      #ifdef bar
      pass
      #else
      fail
      #endif
      `,
      expected: `pass`,
    },
    {
      name: 'ifdef',
      input: `
      #ifdef bar
      fail
      #else
      pass
      #endif
      `,
      expected: `pass`,
    },
    {
      name: 'ifndef',
      input: `
      #ifndef bar
      pass
      #else
      no
      #endif
      `,
      expected: `pass`,
    },
    {
      name: 'ifndef',
      input: `
      #define bar
      #ifndef bar
      fail
      #else
      pass
      #endif
      `,
      expected: `pass`,
    },
    {
      name: 'if',
      input: `
      #define bar
      #if defined(bar)
      pass
      #else
      fail
      #endif
      `,
      expected: `pass`,
    },
    {
      name: 'if !',
      input: `
      #define bar
      #if !defined(bar)
      fail
      #else
      pass
      #endif
      `,
      expected: `pass`,
    },
    {
      name: 'define',
      input: `
      #define fail pass
      fail
      `,
      expected: `pass`,
    },
    {
      name: 'undef',
      input: `
      #define foo
      #ifdef foo
      pass
      #endif

      #undef foo
      #ifdef foo
      fail
      #endif
      `,
      expected: `pass`,
    },
  ]
  test.each(tests)('$name', ({ input, expected }) => {
    const tokens = tokenizeFn(input)
    const output = preprocess(tokens, tokenizeFn)
    expect(printTokens(output)).toEqual(expected)
  })
})
