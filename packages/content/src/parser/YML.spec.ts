import { YML } from './yml'

describe('content/parser/YML', () => {

  it ('parses empty input', () => {
    const result = YML.parse(``)
    expect(result).toBeDefined()
    expect(Object.keys(result).length).toBe(0)
  })

  it ('parses shallow object', () => {
    const result = YML.parse(`
      foo: lorem
      bar: ipsum
      baz: dolor
    `)
    expect(result).toBeDefined()
    expect(result.foo).toBe('lorem')
    expect(result.bar).toBe('ipsum')
    expect(result.baz).toBe('dolor')
  })

  it ('parses nested object', () => {
    const result = YML.parse(`
      foo:
        foo1: lorem1
        foo2: lorem2
        foo3:
          foo13: lorem13
      bar: ipsum
        bar1: dolor1
        bar2: dolor2
        bar3: dolor3
          bar13: dolor13
    `)
    expect(result).toBeDefined()
    expect(result.foo.foo1).toBe('lorem1')
    expect(result.foo.foo2).toBe('lorem2')
    expect(result.foo.foo3.foo13).toBe('lorem13')
    expect(result.bar.bar1).toBe('dolor1')
    expect(result.bar.bar2).toBe('dolor2')
    expect(result.bar.bar3.bar13).toBe('dolor13')
  })

  it ('combines multiple keys into arrays', () => {
    const result = YML.parse(`
      foo: lorem
      foo: ipsum
    `)
    expect(result).toBeDefined()
    expect(result.foo).toEqual(['lorem', 'ipsum'])
  })

  it ('parses multiline string', () => {
    const result = YML.parse(`
      foo: |
        foo lorem
        foo ipsum
        foo dolor
      bar:
        bar lorem
        bar ipsum
        bar dolor
    `)
    expect(result).toBeDefined()
    expect(result.foo).toEqual('foo lorem\nfoo ipsum\nfoo dolor')
    expect(result.bar).toEqual('bar lorem\nbar ipsum\nbar dolor')
  })
})
