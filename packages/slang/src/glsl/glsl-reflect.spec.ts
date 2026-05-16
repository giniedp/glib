import { describe, expect, test } from 'vitest'
import { parseGlsl } from './glsl-parse'
import { reflectGlslShader, type GlslShaderInfo } from './glsl-reflect'

describe('glslReflect', () => {
  describe('scalar', () => {
    const tests = [
      {
        input: /*glsl*/ `uniform float value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'scalar',
              componentType: 'float32',
              componentCount: 1,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform int value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'scalar',
              componentType: 'int32',
              componentCount: 1,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform uint value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'scalar',
              componentType: 'uint32',
              componentCount: 1,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform bool value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'scalar',
              componentType: 'int32',
              componentCount: 1,
            },
          ],
        } satisfies GlslShaderInfo,
      },
    ]

    test.each(tests)('$input', ({ input, expected }) => {
      const result = reflectGlslShader(parseGlsl(input))
      expect(result).toEqual(expected)
    })
  })

  describe('vector', () => {
    const tests = [
      {
        input: /*glsl*/ `uniform vec2 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'vec2',
              componentType: 'float32',
              componentCount: 2,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform vec3 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'vec3',
              componentType: 'float32',
              componentCount: 3,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform vec4 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'vec4',
              componentType: 'float32',
              componentCount: 4,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform uvec3 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'vec3',
              componentType: 'uint32',
              componentCount: 3,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform ivec3 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'vec3',
              componentType: 'int32',
              componentCount: 3,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform bvec3 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'vec3',
              componentType: 'int32',
              componentCount: 3,
            },
          ],
        } satisfies GlslShaderInfo,
      },
    ]

    test.each(tests)('$input', ({ input, expected }) => {
      const result = reflectGlslShader(parseGlsl(input))
      expect(result).toEqual(expected)
    })
  })

  describe('matrix', () => {
    const tests = [
      {
        input: /*glsl*/ `uniform mat2 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'mat2x2',
              componentType: 'float32',
              componentCount: 4,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform mat2x2 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'mat2x2',
              componentType: 'float32',
              componentCount: 4,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform mat3 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'mat3x3',
              componentType: 'float32',
              componentCount: 9,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform mat3x3 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'mat3x3',
              componentType: 'float32',
              componentCount: 9,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform mat4 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'mat4x4',
              componentType: 'float32',
              componentCount: 16,
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform mat4x4 value;`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'mat4x4',
              componentType: 'float32',
              componentCount: 16,
            },
          ],
        } satisfies GlslShaderInfo,
      },
    ]

    test.each(tests)('$input', ({ input, expected }) => {
      const result = reflectGlslShader(parseGlsl(input))
      expect(result).toEqual(expected)
    })
  })

  describe('array', () => {
    const tests = [
      {
        input: /*glsl*/ `uniform float value[10];`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'array',
              elementCount: 10,
              element: {
                container: 'scalar',
                componentType: 'float32',
                componentCount: 1,
              },
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform int value[10];`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'array',
              elementCount: 10,
              element: {
                container: 'scalar',
                componentType: 'int32',
                componentCount: 1,
              },
            },
          ],
        } satisfies GlslShaderInfo,
      },
      {
        input: /*glsl*/ `uniform float value[10][5];`,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'value',
              alias: null,
              container: 'array',
              elementCount: 10,
              element: {
                container: 'array',
                elementCount: 5,
                element: {
                  container: 'scalar',
                  componentType: 'float32',
                  componentCount: 1,
                },
              },
            },
          ],
        } satisfies GlslShaderInfo,
      },
    ]

    test.each(tests)('$input', ({ input, expected }) => {
      const result = reflectGlslShader(parseGlsl(input))
      expect(result).toEqual(expected)
    })
  })

  describe('structs', () => {
    const tests = [
      {
        input: /*glsl*/ `
        struct Value {
          float field1;
        };
        uniform Value instance;
        `,
        expected: {
          inputs: [],
          outputs: [],
          uniforms: [
            {
              name: 'instance',
              alias: null,
              container: 'struct',
              member: [
                {
                  name: 'field1',
                  alias: null,
                  container: 'scalar',
                  componentType: 'float32',
                  componentCount: 1,
                },
              ],
            },
          ],
        } satisfies GlslShaderInfo,
      },
    ]

    test.each(tests)('$input', ({ input, expected }) => {
      const result = reflectGlslShader(parseGlsl(input))
      expect(result).toEqual(expected)
    })
  })
})
