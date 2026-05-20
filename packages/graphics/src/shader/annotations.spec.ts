import { describe, expect, it } from 'vitest'
import { parseAnnotations } from './annotations'

describe('parseAnnotations', () => {
  it('parses single line', () => {
    expect(parseAnnotations('@foo bar', {})).toEqual({ foo: 'bar' })
  })
  it('trims values', () => {
    expect(parseAnnotations('@foo   bar  ', {})).toEqual({ foo: 'bar' })
  })
  it('parses multiple lines', () => {
    expect(parseAnnotations('@foo bar\n@baz value', {})).toEqual({ foo: 'bar', baz: 'value' })
  })

  it('parses multiple lines as array', () => {
    expect(parseAnnotations(['@foo bar', '@baz value'], {})).toEqual({ foo: 'bar', baz: 'value' })
  })

  it('parses embedded multiple lines', () => {
    expect(parseAnnotations(['@foo bar\n@baz value'], {})).toEqual({ foo: 'bar', baz: 'value' })
  })
})
