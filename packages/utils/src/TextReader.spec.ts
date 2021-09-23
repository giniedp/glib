import { TextReader } from './TextReader'

describe('Glib.Core.TextReader', () => {

  describe('#read', () => {
    let r: TextReader
    it('reads one character at a time', () => {
      r = new TextReader('text1 text2 text3')
      expect(r.read()).toBe('t')
      expect(r.read()).toBe('e')
      expect(r.read()).toBe('x')
      expect(r.read()).toBe('t')
      expect(r.read()).toBe('1')
    })

    it('reads the given number of characters', () => {
      r = new TextReader('text1 text2 text3')
      expect(r.read(4)).toBe('text')
      expect(r.read()).toBe('1')
    })
  })

  describe('#readText', () => {
    let r: TextReader
    it('skips leading whitespaces', () => {
      r = new TextReader(' \n \t \r text1 text2 text3')
      expect(r.readText()).toBe('text1')
    })

    it('terminates at next whitespace', () => {
      r = new TextReader('text1 text2\ntext3\ttext4')
      expect(r.readText()).toBe('text1')
      expect(r.readText()).toBe('text2')
      expect(r.readText()).toBe('text3')
      expect(r.readText()).toBe('text4')
    })

    it('does not terminate at any symbol', () => {
      r = new TextReader('text-1 text_2', { symbols: '-_' })
      expect(r.readText()).toBe('text-1')
      expect(r.readText()).toBe('text_2')
      r = new TextReader('text-1 text_2', { symbols: '' })
      expect(r.readText()).toBe('text-1')
      expect(r.readText()).toBe('text_2')
    })
  })

  describe('#readToken', () => {
    let r: TextReader
    it('skips leading whitespaces', () => {
      r = new TextReader(' \n \t \r text1 text2 text3')
      expect(r.readToken()).toBe('text1')
    })

    it('terminates at next whitespace', () => {
      r = new TextReader('text1 text2\ntext3\ttext4')
      expect(r.readToken()).toBe('text1')
      expect(r.readToken()).toBe('text2')
      expect(r.readToken()).toBe('text3')
      expect(r.readToken()).toBe('text4')
    })

    it('terminates at next symbol', () => {
      r = new TextReader('text-1 text_2\ntext.3\ttext#4', { symbols: '-_' })
      expect(r.readToken()).toBe('text')
      r.skip(1)
      expect(r.readToken()).toBe('1')
      expect(r.readToken()).toBe('text')
      r.skip(1)
      expect(r.readToken()).toBe('2')
      expect(r.readToken()).toBe('text.3')
      expect(r.readToken()).toBe('text#4')
    })
  })

  describe('#readLine', () => {
    let r: TextReader
    it ('reads until next new line', () => {
      r = new TextReader('text 1\ntext 2\n')
      expect(r.readLine()).toBe('text 1')
      expect(r.readLine()).toBe('text 2')
    })
    it ('trims whitespaces', () => {
      r = new TextReader(' text 1\n\ttext 2\n')
      expect(r.readLine()).toBe('text 1')
      expect(r.readLine()).toBe('text 2')
    })
    it ('does not skip blank lines', () => {
      r = new TextReader(' text 1\n\ntext 2\n\n')
      expect(r.readLine()).toBe('text 1')
      expect(r.readLine()).toBe('')
      expect(r.readLine()).toBe('text 2')
      expect(r.readLine()).toBe('')
    })
  })

  describe('#readLineRaw', () => {
    let r: TextReader
    it ('reads until next new line', () => {
      r = new TextReader('text 1\ntext 2\n')
      expect(r.readLineRaw()).toBe('text 1\n')
      expect(r.readLineRaw()).toBe('text 2\n')
    })
    it ('does not trim whitespaces', () => {
      r = new TextReader(' text 1\n\ttext 2\n')
      expect(r.readLineRaw()).toBe(' text 1\n')
      expect(r.readLineRaw()).toBe('\ttext 2\n')
    })
    it ('does not skip blank lines', () => {
      r = new TextReader(' text 1\n\ntext 2\n\n')
      expect(r.readLineRaw()).toBe(' text 1\n')
      expect(r.readLineRaw()).toBe('\n')
      expect(r.readLineRaw()).toBe('text 2\n')
      expect(r.readLineRaw()).toBe('\n')
    })
  })

  describe('#readBlock', () => {
    let r: TextReader
    it('reads content of block', () => {
      r = new TextReader('{ foo bar baz }')
      expect(r.readBlock('{', '}')).toBe(' foo bar baz ')
    })
    it('skips leading whitespaces', () => {
      r = new TextReader(' \n \t \r (text1)')
      expect(r.readBlock('(', ')')).toBe('text1')
    })
    it('keeps nested blocks', () => {
      r = new TextReader('{ foo { bar { baz} } }')
      expect(r.readBlock('{', '}')).toBe(' foo { bar { baz} } ')
    })
  })

  describe('#readUntil', () => {
    let r: TextReader
    it('reads until occurence of any delimiter character', () => {
      r = new TextReader('text1 text2 text3')
      expect(r.readUntil('321')).toBe('text')
    })

    it('excludes the delimiter character', () => {
      r = new TextReader('text1 text2 text3')
      expect(r.readUntil('123')).toBe('text')
      r.skip(1)
      expect(r.readUntil('123')).toBe(' text')
      r.skip(1)
      expect(r.readUntil('123')).toBe(' text')
    })

    it('includes the delimiter character if configured', () => {
      r = new TextReader('text1 text2 text3')
      expect(r.readUntil('123', true)).toBe('text1')
      expect(r.readUntil('123', true)).toBe(' text2')
      expect(r.readUntil('123', true)).toBe(' text3')
    })
  })

  describe('#readUntilText', () => {
    let r: TextReader
    it('reads until occurence of given text', () => {
      r = new TextReader('text1 text2 text3')
      expect(r.readUntilText('text2')).toBe('text1 ')
    })

    it('includes the delimiter text if configured', () => {
      r = new TextReader('text1 text2 text3')
      expect(r.readUntilText('text2', true)).toBe('text1 text2')
    })
  })

  // it('skipUntil', () => {
  //   const r = new TextReader('foo (bar) {baz}')
  //   r.skipUntil('({')
  //   expect(r.char).toBe('(')

  //   r.read()
  //   r.skipUntil('({', true)
  //   expect(r.char).toBe('b')
  //   expect(r.rest).toBe('baz}')
  // })

  // it('skipWhile', () => {
  //   const r = new TextReader('abababab123')
  //   r.skipChars('ba')
  //   expect(r.char).toBe('1')
  //   expect(r.rest).toBe('123')
  // })

  // it('nextBlock', () => {
  //   const r = new TextReader('foo ( 1, 2, 3 ) bar ( 4, 5, 6 ) baz { 7, 8, 9 } ')

  //   expect(r.readBlock('({', ')}')).toBe(' 1, 2, 3 ')
  //   expect(r.peek(4)).toBe(' bar')

  //   expect(r.readBlock('({', ')}')).toBe(' 4, 5, 6 ')
  //   expect(r.peek(4)).toBe(' baz')

  //   expect(r.readBlock('({', ')}')).toBe(' 7, 8, 9 ')
  //   expect(r.peek()).toBe(' ')
  // })
})
