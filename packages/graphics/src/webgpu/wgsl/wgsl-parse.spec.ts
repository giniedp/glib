import { describe, expect, test } from 'vitest'
import { identifier$, integer$, keyword$, symbol$ } from '../../shader'
import {
  wgslAssert,
  wgslAttribute,
  wgslDataDeclaration,
  wgslDirective,
  wgslFunction,
  wgslFunctionParam,
  wgslFunctionReturnType,
  wgslStruct,
  wgslStructMember,
  wgslTypeAlias,
  wgslTypeRefence,
} from './wgsl-ast'
import { parseWgsl } from './wgsl-parse'
import { templateList$ } from './wgsl-tokenize'

describe('parseWgsl', () => {
  describe('directives', () => {
    const tests = [
      {
        input: /*wgsl*/ `enable arbitrary_precision_float;`,
        expected: [wgslDirective('enable', 'arbitrary_precision_float')],
      },
      {
        input: /*wgsl*/ `enable foo,bar, baz;`,
        expected: [wgslDirective('enable', 'foo, bar, baz')],
      },
      {
        input: /*wgsl*/ `requires foo,bar, baz;`,
        expected: [wgslDirective('requires', 'foo, bar, baz')],
      },
      {
        input: /*wgsl*/ `requires foo,bar, baz;`,
        expected: [wgslDirective('requires', 'foo, bar, baz')],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseWgsl(input)
      expect(program).toEqual(expected)
    })
  })

  describe('asserts', () => {
    const tests = [
      {
        input: /*wgsl*/ `const_assert x < y;`,
        expected: [wgslAssert('const_assert', 'x<y')],
      },
      {
        input: /*wgsl*/ `const_assert(y != 0);`,
        expected: [wgslAssert('const_assert', '(y!=0)')],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseWgsl(input)
      expect(program).toEqual(expected)
    })
  })

  describe('attributes', () => {
    const tests = [
      {
        input: /*wgsl*/ `@foo fn bar() {}`,
        expected: [wgslFunction([], [wgslAttribute('foo', null)], 'bar', [], null, [])],
      },
      {
        input: /*wgsl*/ `@foo() fn bar() {}`,
        expected: [wgslFunction([], [wgslAttribute('foo', '')], 'bar', [], null, [])],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseWgsl(input)
      expect(program).toEqual(expected)
    })
  })

  describe('alias', () => {
    const tests = [
      {
        input: /*wgsl*/ `alias Arr = array<i32, 5>;`,
        expected: [
          wgslTypeAlias(
            [],
            'Arr',
            wgslTypeRefence('array', templateList$([identifier$('i32'), symbol$(','), integer$('5')])),
          ),
        ],
      },
      {
        input: 'alias RTArr = array<vec4<f32>>;',
        expected: [
          wgslTypeAlias(
            [],
            'RTArr',
            wgslTypeRefence('array', templateList$([identifier$('vec4'), templateList$([identifier$('f32')])])),
          ),
        ],
      },
      {
        input: 'alias single = f32;',
        expected: [wgslTypeAlias([], 'single', wgslTypeRefence('f32', null))],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseWgsl(input)
      expect(program).toEqual(expected)
    })
  })

  describe('const', () => {
    const tests = [
      {
        input: /*wgsl*/ `const a = 4;`,
        expected: [wgslDataDeclaration('const', [], [], [], 'a', null, [integer$('4')])],
      },
      {
        input: /*wgsl*/ `const a: i32 = 4;`,
        expected: [wgslDataDeclaration('const', [], [], [], 'a', wgslTypeRefence('i32', null), [integer$('4')])],
      },
      {
        input: /*wgsl*/ `const a: u32 = 4;`,
        expected: [wgslDataDeclaration('const', [], [], [], 'a', wgslTypeRefence('u32', null), [integer$('4')])],
      },
      {
        input: /*wgsl*/ `const a = vec3(a, a, a);`,
        expected: [
          wgslDataDeclaration('const', [], [], [], 'a', null, [
            identifier$('vec3'),
            symbol$('('),
            identifier$('a'),
            symbol$(','),
            identifier$('a'),
            symbol$(','),
            identifier$('a'),
            symbol$(')'),
          ]),
        ],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseWgsl(input)
      expect(program).toEqual(expected)
    })
  })

  describe('override', () => {
    const tests = [
      {
        input: /*wgsl*/ `@id(0)    override has_point_light: bool = true;`,
        expected: [
          wgslDataDeclaration(
            'override',
            [],
            [wgslAttribute('id', '0')],
            [],
            'has_point_light',
            wgslTypeRefence('bool', null),
            [keyword$('true')],
          ),
        ],
      },
      {
        input: /*wgsl*/ `@id(1300) override gain: f32;`,
        expected: [
          wgslDataDeclaration(
            'override',
            [],
            [wgslAttribute('id', '1300')],
            [],
            'gain',
            wgslTypeRefence('f32', null),
            null,
          ),
        ],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseWgsl(input)
      expect(program).toEqual(expected)
    })
  })

  describe('var', () => {
    const tests = [
      {
        input: /*wgsl*/ `
          // Uniform buffer. Always read-only, and has more restrictive layout rules.
          @group(0) @binding(2)
          var<uniform> param: Params;
        `.trim(),
        expected: [
          wgslDataDeclaration(
            'var',
            ['Uniform buffer. Always read-only, and has more restrictive layout rules.'],
            [wgslAttribute('group', '0'), wgslAttribute('binding', '2')],
            ['uniform'],
            'param',
            wgslTypeRefence('Params', null),
            null,
          ),
        ],
      },
      {
        input: /*wgsl*/ `
          // A storage buffer, for reading and writing
          @group(0) @binding(0)
          var<storage,read_write> pbuf: /* */ array<vec2<f32>>;
        `.trim(),
        expected: [
          wgslDataDeclaration(
            'var',
            ['A storage buffer, for reading and writing'],
            [wgslAttribute('group', '0'), wgslAttribute('binding', '0')],
            ['storage', 'read_write'],
            'pbuf',
            wgslTypeRefence('array', templateList$([identifier$('vec2'), templateList$([identifier$('f32')])])),
            null,
          ),
        ],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseWgsl(input)
      expect(program).toEqual(expected)
    })
  })
  describe('struct', () => {
    const tests = [
      {
        input: /*wgsl*/ `
struct VertexOutput {
  // comment for pos
  @builtin(position) pos: vec4<f32>,
  /* comment for clip */
  @builtin(clip_distances) clip: array<f32, 8> /* trailing comment */,
  // random comment
}
   `.trim(),
        expected: [
          wgslStruct([], [], 'VertexOutput', [
            wgslStructMember(
              ['comment for pos'],
              [wgslAttribute('builtin', 'position')],
              'pos',
              wgslTypeRefence('vec4', templateList$([identifier$('f32')])),
            ),
            wgslStructMember(
              ['comment for clip'],
              [wgslAttribute('builtin', 'clip_distances')],
              'clip',
              wgslTypeRefence('array', templateList$([identifier$('f32'), symbol$(','), integer$('8')])),
            ),
          ]),
        ],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseWgsl(input)
      expect(program).toEqual(expected)
    })
  })
  describe('functions', () => {
    const tests = [
      {
        input: /*wgsl*/ `
          fn add_two(
            // comment for a
            a: i32,
            // comment for b
            b: f32,
            // random comment
          ) -> i32 {
            return a + b;
          }
        `.trim(),
        expected: [
          wgslFunction(
            [],
            [],
            'add_two',
            [
              wgslFunctionParam(['comment for a'], [], 'a', wgslTypeRefence('i32', null)),
              wgslFunctionParam(['comment for b'], [], 'b', wgslTypeRefence('f32', null)),
            ],
            wgslFunctionReturnType([], [], wgslTypeRefence('i32', null)),
            [keyword$('return'), identifier$('a'), symbol$('+'), identifier$('b'), symbol$(';')],
          ),
        ],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseWgsl(input)
      expect(program).toEqual(expected)
    })
  })
})
