import { TextReader } from '@gglib/utils'

describe('Glib.Core.TextReader', () => {

  it('skipUntil', () => {
    const r = new TextReader('foo (bar) {baz}')
    r.skipUntil('({')
    expect(r.char).toBe('(')

    r.next()
    r.skipUntil('({', true)
    expect(r.char).toBe('b')
    expect(r.rest).toBe('baz}')
  })

  it('skipWhile', () => {
    const r = new TextReader('abababab123')
    r.skipWhile('ba')
    expect(r.char).toBe('1')
    expect(r.rest).toBe('123')
  })

  it('nextToken', () => {
    const r = new TextReader('\r\nfoo\n bar\t baz \fbingo')
    expect(r.nextToken()).toBe('foo')
    expect(r.nextToken()).toBe('bar')
    expect(r.nextToken()).toBe('baz')
    expect(r.nextToken()).toBe('bingo')
    expect(r.nextToken()).toBe('')
  })

  it('nextLine', () => {
    const r = new TextReader('foo foo\nbar bar\nbaz baz\n')
    expect(r.nextLine()).toBe('foo foo')
    expect(r.nextLine()).toBe('bar bar')
    expect(r.nextLine()).toBe('baz baz')
    expect(r.nextToken()).toBe('')
  })

  it('nextBlock', () => {
    const r = new TextReader('foo ( 1, 2, 3 ) bar ( 4, 5, 6 ) baz { 7, 8, 9 } ')
    expect(r.nextBlock('({', ')}')).toBe(' 1, 2, 3 ')
    expect(r.char).toBe(' ')
    expect(r.nextBlock('({', ')}')).toBe(' 4, 5, 6 ')
    expect(r.char).toBe(' ')
    expect(r.nextBlock('({', ')}')).toBe(' 7, 8, 9 ')
  })
})
