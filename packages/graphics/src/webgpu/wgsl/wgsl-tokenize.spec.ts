import { describe, expect, test } from 'vitest'

import { comment$, float$, identifier$, integer$, keyword$, symbol$ } from '../../shader'
import { detectTemplateLists, templateList$, tokenizeWgsl } from './wgsl-tokenize'

describe('tokenizeWgsl', () => {
  describe('comments', () => {
    const tests = [
      {
        input: /*wgsl*/ `
        // inline comment
        `,
        expected: [comment$('inline comment')],
      },
      {
        input: /*wgsl*/ `
        /* comment block */
        `,
        expected: [comment$('comment block')],
      },
      {
        input: /*wgsl*/ `
        /*
          multi line
          comment
        */
        `,
        expected: [comment$('\nmulti line\ncomment\n')],
      },
      {
        input: /*wgsl*/ `
        // line 1
        // line 2
        `,
        expected: [comment$('line 1\nline 2')],
      },
      {
        input: /*wgsl*/ `
        /* line 1 */
        /* line 2 */
        `,
        expected: [comment$('line 1'), comment$('line 2')],
      },
      {
        input: /*wgsl*/ `
          code before
          line before // This is line-ending comment.
          code after
        `,
        expected: [
          identifier$('code'),
          identifier$('before'),
          identifier$('line'),
          identifier$('before'),
          comment$('This is line-ending comment.'),
          identifier$('code'),
          identifier$('after'),
        ],
      },
      {
        input: /*wgsl*/ `
          code before /* block 1 */
          line before /*
          block 2
          */
          code after /* block 3 */
        `,
        expected: [
          identifier$('code'),
          identifier$('before'),
          comment$('block 1'),
          identifier$('line'),
          identifier$('before'),
          comment$('\nblock 2\n'),
          identifier$('code'),
          identifier$('after'),
          comment$('block 3'),
        ],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      expect(tokenizeWgsl(input)).toEqual(expected)
    })
  })

  describe('literals', () => {
    describe('integer', () => {
      const tests = [
        {
          input: /* wgsl */ `const a = 1u;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), integer$('1u'), symbol$(';')],
        },
        {
          input: /* wgsl */ `const a = 123;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), integer$('123'), symbol$(';')],
        },
        {
          input: /* wgsl */ `const a = 0;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), integer$('0'), symbol$(';')],
        },
        {
          input: /* wgsl */ `const a = 0i;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), integer$('0i'), symbol$(';')],
        },
        {
          input: /* wgsl */ `const a = 0x123;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), integer$('0x123'), symbol$(';')],
        },
        {
          input: /* wgsl */ `const a = 0x123u;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), integer$('0x123u'), symbol$(';')],
        },
        {
          input: /* wgsl */ `const a = 0x3f;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), integer$('0x3f'), symbol$(';')],
        },
      ]
      test.each(tests)('$input', ({ input, expected }) => {
        expect(tokenizeWgsl(input)).toEqual(expected)
      })
    })

    describe('float', () => {
      const tests = [
        {
          input: `const a = 0.e+4f;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('0.e+4f'), symbol$(';')],
        },
        {
          input: `const a = 01.;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('01.'), symbol$(';')],
        },
        {
          input: `const a = .01;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('.01'), symbol$(';')],
        },
        {
          input: `const a = 12.34;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('12.34'), symbol$(';')],
        },
        {
          input: `const a = .0f;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('.0f'), symbol$(';')],
        },
        {
          input: `const a = 0h;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('0h'), symbol$(';')],
        },
        {
          input: `const a = 1e-3;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('1e-3'), symbol$(';')],
        },
        {
          input: `const a = 0xa.fp+2;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('0xa.fp+2'), symbol$(';')],
        },
        {
          input: `const a = 0x1P+4f;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('0x1P+4f'), symbol$(';')],
        },
        {
          input: `const a = 0X.3;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('0X.3'), symbol$(';')],
        },
        {
          input: `const a = 0x3p+2h;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('0x3p+2h'), symbol$(';')],
        },
        {
          input: `const a = 0X1.fp-4;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('0X1.fp-4'), symbol$(';')],
        },
        {
          input: `const a = 0x3.2p+2h;`,
          expected: [keyword$('const'), identifier$('a'), symbol$('='), float$('0x3.2p+2h'), symbol$(';')],
        },
      ]
      test.each(tests)('$input', ({ input, expected }) => {
        expect(tokenizeWgsl(input)).toEqual(expected)
      })
    })
  })

  describe('detectTemplateLists', () => {
    const tests = [
      {
        input: `A ( B < C, D > ( E ) )`,
        expected: [
          identifier$('A'),
          symbol$('('),
          identifier$('B'),
          templateList$([identifier$('C'), symbol$(','), identifier$('D')]),
          symbol$('('),
          identifier$('E'),
          symbol$(')'),
          symbol$(')'),
        ],
      },
      {
        input: 'array<i32,select(2,3,a>b)>',
        expected: [
          identifier$('array'),
          templateList$([
            identifier$('i32'),
            symbol$(','),
            identifier$('select'),
            symbol$('('),
            integer$('2'),
            symbol$(','),
            integer$('3'),
            symbol$(','),
            identifier$('a'),
            symbol$('>'),
            identifier$('b'),
            symbol$(')'),
          ]),
        ],
      },
      {
        input: 'a[b<d]>()',
        expected: [
          identifier$('a'),
          symbol$('['),
          identifier$('b'),
          symbol$('<'),
          identifier$('d'),
          symbol$(']'),
          symbol$('>'),
          symbol$('('),
          symbol$(')'),
        ],
      },
      {
        input: 'A<B<<C>',
        expected: [identifier$('A'), templateList$([identifier$('B'), symbol$('<'), symbol$('<'), identifier$('C')])],
      },
      {
        input: 'A<B<=C>',
        expected: [identifier$('A'), templateList$([identifier$('B'), symbol$('<'), symbol$('='), identifier$('C')])],
      },
      {
        input: 'A<(B>=C)>',
        expected: [
          identifier$('A'),
          templateList$([symbol$('('), identifier$('B'), symbol$('>'), symbol$('='), identifier$('C'), symbol$(')')]),
        ],
      },
      {
        input: 'A<(B==C)>',
        expected: [
          identifier$('A'),
          templateList$([symbol$('('), identifier$('B'), symbol$('='), symbol$('='), identifier$('C'), symbol$(')')]),
        ],
      },
      {
        input: 'A<(B!=C)>',
        expected: [
          identifier$('A'),
          templateList$([symbol$('('), identifier$('B'), symbol$('!'), symbol$('='), identifier$('C'), symbol$(')')]),
        ],
      },
      {
        input: 'x<y',
        expected: [identifier$('x'), symbol$('<'), identifier$('y')],
      },
      {
        input: 'var<uniform>',
        expected: [keyword$('var'), templateList$([identifier$('uniform')])],
      },
      {
        input: 'var<uniform> foo: array<array<f32, 5>, 10>;',
        expected: [
          keyword$('var'),
          templateList$([identifier$('uniform')]),
          identifier$('foo'),
          symbol$(':'),
          identifier$('array'),
          templateList$([
            identifier$('array'),
            templateList$([identifier$('f32'), symbol$(','), integer$('5')]),
            symbol$(','),
            integer$('10'),
          ]),
          symbol$(';'),
        ],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const tokens = tokenizeWgsl(input)
      const wgslTokens = detectTemplateLists(tokens)
      expect(wgslTokens).toEqual(expected)
    })
  })
})
