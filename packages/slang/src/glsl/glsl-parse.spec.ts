import { describe, expect, test } from 'vitest'
import { glslInterface, glslStruct, glslStructMember, glslTypeRefence, glslVariableDeclaration } from './glsl-ast'
import { parseGlsl } from './glsl-parse'
import { identifier$, integer$ } from '../shader'

describe('parseGlsl', () => {
  describe('qualifiers', () => {
    const tests = [
      {
        input: /*glsl*/ `uniform float value;`,
        expected: [glslVariableDeclaration([], ['uniform'], null, 'value', glslTypeRefence('float', null), null)],
      },
      {
        input: /*glsl*/ `in float value;`,
        expected: [glslVariableDeclaration([], ['in'], null, 'value', glslTypeRefence('float', null), null)],
      },
      {
        input: /*glsl*/ `out float value;`,
        expected: [glslVariableDeclaration([], ['out'], null, 'value', glslTypeRefence('float', null), null)],
      },
      {
        input: /*glsl*/ `layout(location=3) in float value;`,
        expected: [glslVariableDeclaration([], ['in'], { location: 3 }, 'value', glslTypeRefence('float', null), null)],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseGlsl(input)
      expect(program).toEqual(expected)
    })
  })
  describe('structs', () => {
    const tests = [
      {
        input: /*glsl*/ `
          // comment for struct
          struct light {
            // comment for pos
            vec3 pos;
            // comment for intensity
            float intensity;
            // random comment
          }
          // comment for lightVar
          lightVar;
       `.trim(),
        expected: [
          glslStruct(['comment for struct'], 'light', [
            glslStructMember(['comment for pos'], [], 'pos', glslTypeRefence('vec3', null)),
            glslStructMember(['comment for intensity'], [], 'intensity', glslTypeRefence('float', null)),
          ]),
          glslVariableDeclaration(['comment for lightVar'], [], null, 'lightVar', glslTypeRefence('light', null), null),
        ],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseGlsl(input)
      expect(program).toEqual(expected)
    })
  })

  describe('interfaces', () => {
    const tests = [
      {
        input: /*glsl*/ `
          // comment for Camera
          layout(std40, binding=2)
          uniform Camera {
            // comment for View
            mat4 View;
            // comment for Projection
            mat4 Projection;
            // random comment
          };
       `.trim(),
        expected: [
          glslInterface(
            ['comment for Camera'],
            { std40: void 0, binding: 2 },
            'Camera',
            [
              glslStructMember(['comment for View'], [], 'View', glslTypeRefence('mat4', null)),
              glslStructMember(['comment for Projection'], [], 'Projection', glslTypeRefence('mat4', null)),
            ],
            null,
          ),
        ],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseGlsl(input)
      expect(program).toEqual(expected)
    })
  })

  describe('arrays', () => {
    const tests = [
      {
        input: /*glsl*/ `float values[10];`,
        expected: [glslVariableDeclaration([], [], null, 'values', glslTypeRefence('float', [integer$('10')]), null)],
      },
      {
        input: /*glsl*/ `float values[10][5];`,
        expected: [
          glslVariableDeclaration(
            [],
            [],
            null,
            'values',
            glslTypeRefence('float', [integer$('10'), integer$('5')]),
            null,
          ),
        ],
      },
      {
        input: /*glsl*/ `float[10] values;`,
        expected: [glslVariableDeclaration([], [], null, 'values', glslTypeRefence('float', [integer$('10')]), null)],
      },
      {
        input: /*glsl*/ `uniform vec4 values[4u];`,
        expected: [
          glslVariableDeclaration([], ['uniform'], null, 'values', glslTypeRefence('vec4', [integer$('4u')]), null),
        ],
      },
      {
        input: /*glsl*/ `light lights[numLights];`,
        expected: [
          glslVariableDeclaration([], [], null, 'lights', glslTypeRefence('light', [identifier$('numLights')]), null),
        ],
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const program = parseGlsl(input)
      expect(program).toEqual(expected)
    })
  })
})
