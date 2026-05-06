import type { IVec2, IVec3, IVec4 } from '@gglib/math'
import type { SamplerState } from '../states'
import type { Texture } from './Texture'

export type MatrixLike = { elements: ArrayLike<number> } | ArrayLike<number>
export type ProgramInputValue = number | IVec2 | IVec3 | IVec4 | ArrayLike<number> | MatrixLike | Texture | SamplerState
export type ProgramInputType =
  | 'scalar'
  | 'array'
  | 'vec2'
  | 'vec3'
  | 'vec4'
  | 'mat2x2'
  | 'mat2x3'
  | 'mat2x4'
  | 'mat3x2'
  | 'mat3x3'
  | 'mat3x4'
  | 'mat4x2'
  | 'mat4x3'
  | 'mat4x4'
  | 'texture'
  | 'sampler'

export type ProgramInputs = {
  [key: string]: ProgramInputValue
}

export abstract class ProgramInput {
  public abstract readonly name: string
  public abstract readonly type: ProgramInputType

  public abstract set(value: ProgramInputValue): void
  public abstract setScalar(value: number): void
  public abstract setArray(value: ArrayLike<number>, offset?: number): void
  public abstract setVec2(value: IVec2 | ArrayLike<number>): void
  public abstract setVec3(value: IVec3 | ArrayLike<number>): void
  public abstract setVec4(value: IVec4 | ArrayLike<number>): void
  public abstract setMat2x2(number: MatrixLike): void
  public abstract setMat3x3(number: MatrixLike): void
  public abstract setMat4x4(number: MatrixLike): void
  public abstract setTexture(value: Texture): void
  public abstract setSampler(value: SamplerState): void
}
