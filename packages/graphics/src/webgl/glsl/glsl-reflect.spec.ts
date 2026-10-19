import { describe, expect, test } from 'vitest'
import { parseGlsl } from './glsl-parse'
import { reflectGlslShader, reflectGlslStorageLayout, type GlslShaderInfo } from './glsl-reflect'

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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
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
              annotations: {},
              container: 'struct',
              member: [
                {
                  name: 'field1',
                  annotations: {},
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

  describe('storage', () => {
    test('attaches the element layout to an annotated sampler', () => {
      const result = reflectGlslShader(
        parseGlsl(/*glsl*/ `
          struct ObjectBlock { mat4 modelMatrix; };
          // @storage ObjectBlock
          uniform highp sampler2D object;
        `),
      )
      expect(result.uniforms[0].storage).toEqual({
        type: 'ObjectBlock',
        stride: 64,
        members: [
          {
            name: 'modelMatrix',
            type: expect.objectContaining({ container: 'mat4x4' }),
            offset: 0,
            arraySize: 1,
            arrayStride: 64,
            matrixStride: 16,
          },
        ],
      })
    })

    test('uses WGSL alignment', () => {
      const program = parseGlsl(/*glsl*/ `
        struct Item { float a; vec3 b; vec2 c; float d; mat3 e; vec4 f[2]; };
      `)
      const layout = reflectGlslStorageLayout(program, 'Item')
      expect(layout.members.map((it) => [it.name, it.offset])).toEqual([
        ['a', 0],
        ['b', 16],
        ['c', 32],
        ['d', 40],
        ['e', 48],
        ['f', 96],
      ])
      expect(layout.members[4].matrixStride).toBe(16)
      expect(layout.members[5]).toMatchObject({ arraySize: 2, arrayStride: 16 })
      expect(layout.stride).toBe(128)
    })

    test('supports plain element types', () => {
      const layout = reflectGlslStorageLayout(parseGlsl(''), 'mat4')
      expect(layout.stride).toBe(64)
      expect(layout.members).toEqual([expect.objectContaining({ name: '', offset: 0 })])
    })

    test('pads the stride to the struct alignment', () => {
      const layout = reflectGlslStorageLayout(parseGlsl('struct S { vec3 a; float b; float c; };'), 'S')
      expect(layout.members.map((it) => it.offset)).toEqual([0, 12, 16])
      expect(layout.stride).toBe(32)
    })
  })
})
