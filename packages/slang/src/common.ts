export type ScalarType = 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32' | 'float16'
export type VectorType = 'vec2' | 'vec3' | 'vec4'
export type MatrixType =
  | 'mat2x2'
  | 'mat2x3'
  | 'mat2x4'
  | 'mat3x2'
  | 'mat3x3'
  | 'mat3x4'
  | 'mat4x2'
  | 'mat4x3'
  | 'mat4x4'

export type NumericType = ScalarType | VectorType | MatrixType

export type SamplerType = 'sampler' | 'sampler_comparison'

export type TextureType =
  | 'texture_2d'
  | 'texture_2d_array'
  | 'texture_3d'
  | 'texture_cube'
  | 'texture_cube_array'
  | 'texture_depth_2d'
  | 'texture_storage_2d'

export type ResourceType = TextureType | SamplerType

export type ShaderInputType = VectorType | MatrixType | 'scalar' | 'array' | 'texture' | 'sampler'
