// prettier-ignore
export const GlslKeywords = {
  all: new Set<string>([]),
  types: new Set([
    'void',
    'bool',
    'int',
    'uint',
    'float',
    'double',
    'half',
    'long',
    'short',
    'bvec2',
    'bvec3',
    'bvec4',
    'dvec2',
    'dvec3',
    'dvec4',
    'fvec2',
    'fvec3',
    'fvec4',
    'hvec2',
    'hvec3',
    'hvec4',
    'ivec2',
    'ivec3',
    'ivec4',
    'uvec2',
    'uvec3',
    'uvec4',
    'vec2',
    'vec3',
    'vec4',
    'mat2',
    'mat2x2',
    'mat2x3',
    'mat2x4',
    'mat3',
    'mat3x2',
    'mat3x3',
    'mat3x4',
    'mat4',
    'mat4x2',
    'mat4x3',
    'mat4x4',
    'isampler1D',
    'isampler1DArray',
    'isampler2D',
    'isampler2DArray',
    'isampler2DMS',
    'isampler2DRect',
    'isampler3D',
    'isamplerBuffer',
    'isamplerCube',
    'sampler1D',
    'sampler1DArray',
    'sampler1DArrayShadow',
    'sampler1DShadow',
    'sampler2D',
    'sampler2DArray',
    'sampler2DArrayShadow',
    'sampler2DMS',
    'sampler2DRect',
    'sampler2DRectShadow',
    'sampler2DShadow',
    'sampler3D',
    'sampler3DRect',
    'samplerBuffer',
    'samplerCube',
    'samplerCubeShadow',
    'usampler1D',
    'usampler1DArray',
    'usampler2D',
    'usampler2DArray',
    'usampler2DMS',
    'usampler2DRect',
    'usampler3D',
    'usamplerBuffer',
    'usamplerCube',
  ]),

  layout: new Set(['layout']),
  struct: new Set(['struct']),

  qualifier: new Set([
    'invariant',
    // interpolation
    'centroid',
    'smooth',
    'flat',
    // storage
    'const',
    'in',
    'out',
    'uniform',
    'varying',
    'attribute',
    // precision
    'lowp',
    'mediump',
    'highp',
    // memory
    'coherent',
    'volatile',
    'readonly',
    'restrict',
    'writeonly',
  ]),

  boolean: new Set([
    'true',
    'false',
  ]),

  controlFlow: new Set([
    'switch',
    'case',
    'break',
    'continue',
    'default',
    'for',
    'do',
    'while',
    'if',
    'else',
    'goto',
    'return',
  ]),

  unclassified: new Set([
    'active',
    'asm',
    'atomic_uint',

    'common',
    'discard',
    'extern',
    'external',

    'filter',
    'fixed',
    'precision',
  ]),

  reserved: new Set([
    'class',
    'enum',
    'interface',

    'iimage1D',
    'iimage1DArray',
    'iimage2D',
    'iimage2DArray',
    'iimage3D',
    'iimageBuffer',
    'iimageCube',
    'image1D',
    'image1DArray',
    'image2D',
    'image2DArray',
    'image3D',
    'imageBuffer',
    'imageCube',
    'uimage1D',
    'uimage1DArray',
    'uimage2D',
    'uimage2DArray',
    'uimage3D',
    'uimageBuffer',
    'uimageCube',

    'inline',
    'noinline',
    'inout',
    'input',
    'output',

    'noperspective',

    'partition',
    'patch',
    'public',
    'resource',
    'sample',
    'static',
    'subroutine',
    'superp',
    'template',
    'this',
    'typedef',
    'union',
    'unsigned',
  ])
}

Object.keys(GlslKeywords).forEach((key) => {
  GlslKeywords[key].forEach((word: string) => {
    GlslKeywords.all.add(word)
  })
})

export function isGlslQualifier(word: string): boolean {
  return GlslKeywords.qualifier.has(word)
}

export function isGlslType(word: string): boolean {
  return GlslKeywords.types.has(word)
}
export function isUnclassified(word: string): boolean {
  return GlslKeywords.unclassified.has(word)
}
