import { describe, expect, test } from 'vitest'

import { parseWgsl } from './wgsl-parse'
import { WgslProgramInfo, reflectWgsl, type WgslInputInfo } from './wgsl-reflect'

describe('wgslReflect', () => {
  describe('scalar', () => {
    const tests = [
      {
        input: /* wgsl */ `var<uniform> param: f32;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float32',
              container: 'scalar',
              elementContainer: null,
              elementStride: null,
              elementCount: 1,
              offset: 0,
              align: 4,
              size: 4,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: f16;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float16',
              container: 'scalar',
              elementContainer: null,
              elementStride: null,
              elementCount: 1,
              offset: 0,
              align: 2,
              size: 2,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: u32;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'uint32',
              container: 'scalar',
              elementContainer: null,
              elementStride: null,
              elementCount: 1,
              offset: 0,
              align: 4,
              size: 4,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: i32;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'int32',
              container: 'scalar',
              elementContainer: null,
              elementStride: null,
              elementCount: 1,
              offset: 0,
              align: 4,
              size: 4,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: bool;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'int32',
              container: 'scalar',
              elementContainer: null,
              elementStride: null,
              elementCount: 1,
              offset: 0,
              align: 4,
              size: 4,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `alias A = f16; alias B = A; var<uniform> param: B;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float16',
              container: 'scalar',
              elementContainer: null,
              elementStride: null,
              elementCount: 1,
              offset: 0,
              align: 2,
              size: 2,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
    ]

    test.each(tests)('$input', ({ input, expected }) => {
      const result = reflectWgsl(parseWgsl(input))
      expect(result).toEqual(expected)
    })
  })

  describe('vector', () => {
    const tests = [
      {
        input: /* wgsl */ `var<uniform> param: vec2i;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'int32',
              container: 'vec2',
              elementContainer: null,
              elementStride: null,
              elementCount: 2,
              offset: 0,
              align: 8,
              size: 8,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: vec2u;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'uint32',
              container: 'vec2',
              elementContainer: null,
              elementStride: null,
              elementCount: 2,
              offset: 0,
              align: 8,
              size: 8,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: vec2f;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float32',
              container: 'vec2',
              elementContainer: null,
              elementStride: null,
              elementCount: 2,
              offset: 0,
              align: 8,
              size: 8,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: vec2h;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float16',
              container: 'vec2',
              elementContainer: null,
              elementStride: null,
              elementCount: 2,
              offset: 0,
              align: 4,
              size: 4,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: vec2<i32>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'int32',
              container: 'vec2',
              elementContainer: null,
              elementStride: null,
              elementCount: 2,
              offset: 0,
              align: 8,
              size: 8,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: vec2<u32>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'uint32',
              container: 'vec2',
              elementContainer: null,
              elementStride: null,
              elementCount: 2,
              offset: 0,
              align: 8,
              size: 8,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: vec2<f32>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float32',
              container: 'vec2',
              elementContainer: null,
              elementStride: null,
              elementCount: 2,
              offset: 0,
              align: 8,
              size: 8,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: vec2<f16>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float16',
              container: 'vec2',
              elementContainer: null,
              elementStride: null,
              elementCount: 2,
              offset: 0,
              align: 4,
              size: 4,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `alias A = f16; alias B = A; var<uniform> param: vec2<B>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float16',
              container: 'vec2',
              elementContainer: null,
              elementStride: null,
              elementCount: 2,
              offset: 0,
              align: 4,
              size: 4,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const result = reflectWgsl(parseWgsl(input))
      expect(result).toEqual(expected)
    })
  })

  describe('matrix', () => {
    const tests = [
      {
        input: /* wgsl */ `var<uniform> param: mat2x3f;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float32',
              container: 'mat2x3',
              elementContainer: 'vec3',
              elementStride: 16,
              elementCount: 6,
              offset: 0,
              align: 16,
              size: 32,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: mat2x3h;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float16',
              container: 'mat2x3',
              elementContainer: 'vec3',
              elementStride: 8,
              elementCount: 6,
              offset: 0,
              align: 8,
              size: 16,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: mat2x3<f32>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float32',
              container: 'mat2x3',
              elementContainer: 'vec3',
              elementStride: 16,
              elementCount: 6,
              offset: 0,
              align: 16,
              size: 32,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: mat2x3<f16>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              container: 'mat2x3',
              elementType: 'float16',
              elementCount: 6,
              elementStride: 8,
              elementContainer: 'vec3',
              offset: 0,
              align: 8,
              size: 16,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: mat2x3<i32>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'int32',
              container: 'mat2x3',
              elementContainer: 'vec3',
              elementStride: 16,
              elementCount: 6,
              offset: 0,
              align: 16,
              size: 32,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const result = reflectWgsl(parseWgsl(input))
      expect(result).toEqual(expected)
    })
  })

  describe('array', () => {
    const tests = [
      {
        input: /* wgsl */ `var<uniform> param: array<f32, 10>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              container: 'array',
              elementType: 'float32',
              elementCount: 10,
              elementContainer: 'scalar',
              elementStride: 4,
              offset: 0,
              align: 4,
              size: 40,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: array<f16, 10>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float16',
              container: 'array',
              elementCount: 10,
              elementContainer: 'scalar',
              elementStride: 2,
              offset: 0,
              align: 2,
              size: 20,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: array<i32, 10>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'int32',
              container: 'array',
              elementCount: 10,
              elementContainer: 'scalar',
              elementStride: 4,
              offset: 0,
              align: 4,
              size: 40,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: array<u32, 10>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'uint32',
              container: 'array',
              elementCount: 10,
              elementContainer: 'scalar',
              elementStride: 4,
              offset: 0,
              align: 4,
              size: 40,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: array<array<array<f32, 2>, 4>, 10>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              elementType: 'float32',
              container: 'array',
              elementCount: 80,
              elementContainer: 'scalar',
              elementStride: 4 * 2 * 4,
              offset: 0,
              align: 4,
              size: 320,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
      {
        input: /* wgsl */ `var<uniform> param: array<vec3<f32>, 10>;`,
        expected: {
          resources: [
            {
              name: 'param',
              alias: null,
              binding: null,
              group: null,
              location: null,
              container: 'array',
              elementType: 'float32',
              elementCount: 30,
              elementContainer: 'vec3',
              elementStride: 16,
              offset: 0,
              align: 16,
              size: 160,
              isUniform: true,
              isStorage: false,
              isReadWrite: false,
              members: null,
              sampler: null,
              texture: null,
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const result = reflectWgsl(parseWgsl(input))
      expect(result).toEqual(expected)
    })
  })

  describe('struct', () => {
    const tests = [
      {
        input: /* wgsl */ `
        struct S { a: vec3<f32>, b: f32, }
        var<uniform> param: S;
        `,
        expected: {
          resources: [
            {
              alias: null,
              align: 16,
              binding: null,
              container: 'array',
              elementContainer: null,
              elementCount: 16,
              elementStride: null,
              elementType: 'uint8',
              group: null,
              isReadWrite: false,
              isStorage: false,
              isUniform: true,
              location: null,
              name: 'param',
              offset: 0,
              sampler: null,
              size: 16,
              texture: null,
              members: [
                {
                  alias: null,
                  align: 16,
                  binding: null,
                  container: 'vec3',
                  elementContainer: null,
                  elementCount: 3,
                  elementStride: null,
                  elementType: 'float32',
                  group: null,
                  isReadWrite: false,
                  isStorage: false,
                  isUniform: false,
                  location: null,
                  members: null,
                  name: 'a',
                  offset: 0,
                  sampler: null,
                  size: 12,
                  texture: null,
                },
                {
                  alias: null,
                  align: 4,
                  binding: null,
                  container: 'scalar',
                  elementContainer: null,
                  elementCount: 1,
                  elementStride: null,
                  elementType: 'float32',
                  group: null,
                  isReadWrite: false,
                  isStorage: false,
                  isUniform: false,
                  location: null,
                  members: null,
                  name: 'b',
                  offset: 12,
                  sampler: null,
                  size: 4,
                  texture: null,
                },
              ],
            },
          ],
          entryPoints: [],
        } satisfies WgslProgramInfo,
      },
    ]
    test.each(tests)('$input', ({ input, expected }) => {
      const result = reflectWgsl(parseWgsl(input))
      expect(result).toEqual(expected)
    })
  })
  describe('vertex shader inputs', () => {
    const tests = [
      {
        name: 'simple attributes',
        input: /*wgsl*/ `
          @vertex
          fn vertexMain(
            // @alias position
            @location(0) pos: vec2f
          ) {
            return vec4f(0, 0, 0, 1);
          }
        `,
        expected: [
          {
            container: 'vec2',
            elementContainer: null,
            elementStride: null,
            elementType: 'float32',
            elementCount: 2,
            name: 'pos',
            location: 0,
            alias: 'position',
          },
        ] satisfies WgslInputInfo[],
      },
      {
        name: 'struct attributes',
        input: /*wgsl*/ `
          struct Vertex {
            // @alias position
            @location(0)
            pos: vec2f
          }
          @vertex
          fn vertexMain(
            v: Vertex
          ) {
            return vec4f(0, 0, 0, 1);
          }
        `,
        expected: [
          {
            container: 'vec2',
            elementContainer: null,
            elementStride: null,
            elementType: 'float32',
            elementCount: 2,
            name: 'pos',
            location: 0,
            alias: 'position',
          },
        ] satisfies WgslInputInfo[],
      },
    ]
    test.each(tests)('$name', ({ input, expected }) => {
      const result = reflectWgsl(parseWgsl(input))
      const inputs = result.entryPoints.find((it) => it.stage === 'vertex').inputs
      expect(inputs).toEqual(expected)
    })
  })
  const tests = [
    {
      input: /* wgsl */ `@group(0) @binding(0) var<uniform> foo: vec2f;`,
      expected: {
        resources: [
          {
            name: 'foo',
            alias: null,
            binding: 0,
            group: 0,
            location: null,
            container: 'vec2',
            elementContainer: null,
            elementStride: null,
            elementType: 'float32',
            elementCount: 2,
            offset: 0,
            align: 8,
            size: 8,
            isUniform: true,
            isStorage: false,
            isReadWrite: false,
            members: null,
            sampler: null,
            texture: null,
          },
        ],
        entryPoints: [],
      } satisfies WgslProgramInfo,
    },
    {
      input: /* wgsl */ `@group(1) @binding(0) var<uniform> foo: vec2f;`,
      expected: {
        resources: [
          {
            name: 'foo',
            alias: null,
            binding: 0,
            group: 1,
            location: null,
            container: 'vec2',
            elementContainer: null,
            elementStride: null,
            elementType: 'float32',
            elementCount: 2,
            offset: 0,
            align: 8,
            size: 8,
            isUniform: true,
            isStorage: false,
            isReadWrite: false,
            members: null,
            sampler: null,
            texture: null,
          },
        ],
        entryPoints: [],
      } satisfies WgslProgramInfo,
    },
    {
      input: /* wgsl */ `@group(1) @binding(2) var<uniform> foo: vec2f;`,
      expected: {
        resources: [
          {
            name: 'foo',
            alias: null,
            binding: 2,
            group: 1,
            location: null,
            container: 'vec2',
            elementContainer: null,
            elementStride: null,
            elementType: 'float32',
            elementCount: 2,
            offset: 0,
            align: 8,
            size: 8,
            isUniform: true,
            isStorage: false,
            isReadWrite: false,
            members: null,
            sampler: null,
            texture: null,
          },
        ],
        entryPoints: [],
      } satisfies WgslProgramInfo,
    },
    {
      input: /* wgsl */ `/* @alias bar*/ @group(1) @binding(2) var<uniform> foo: vec2f;`,
      expected: {
        resources: [
          {
            name: 'foo',
            alias: 'bar',
            binding: 2,
            group: 1,
            location: null,
            container: 'vec2',
            elementContainer: null,
            elementStride: null,
            elementType: 'float32',
            elementCount: 2,
            offset: 0,
            align: 8,
            size: 8,
            isUniform: true,
            isStorage: false,
            isReadWrite: false,
            members: null,
            sampler: null,
            texture: null,
          },
        ],
        entryPoints: [],
      } satisfies WgslProgramInfo,
    },
    {
      input: /* wgsl */ `@group(1) @binding(2) /* @alias bar*/ var<uniform> foo: vec2f;`,
      expected: {
        resources: [
          {
            name: 'foo',
            alias: 'bar',
            binding: 2,
            group: 1,
            location: null,
            container: 'vec2',
            elementType: 'float32',
            elementCount: 2,
            elementContainer: null,
            elementStride: null,
            offset: 0,
            align: 8,
            size: 8,
            isUniform: true,
            isStorage: false,
            isReadWrite: false,
            members: null,
            sampler: null,
            texture: null,
          },
        ],
        entryPoints: [],
      } satisfies WgslProgramInfo,
    },
  ]
  test.each(tests)('$input', ({ input, expected }) => {
    const result = reflectWgsl(parseWgsl(input))
    expect(result).toEqual(expected)
  })
})
