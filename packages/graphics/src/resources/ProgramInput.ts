import type { IVec2, IVec3, IVec4 } from '@gglib/math'
import { Brand } from '@gglib/utils'
import type { SamplerState } from '../states'
import { Buffer } from './Buffer'
import type { Texture } from './Texture'

export type MatrixLike = { elements: ArrayLike<number> } | ArrayLike<number>
export type InputValueType = number | IVec2 | IVec3 | IVec4 | ArrayLike<number> | MatrixLike | Texture | SamplerState
export type InputTypeName =
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

export type InputTypeMap = {
  scalar: number
  array: ArrayLike<number>
  vec2: IVec2
  vec3: IVec3
  vec4: IVec4
  mat2x2: MatrixLike
  mat2x3: MatrixLike
  mat2x4: MatrixLike
  mat3x2: MatrixLike
  mat3x3: MatrixLike
  mat3x4: MatrixLike
  mat4x2: MatrixLike
  mat4x3: MatrixLike
  mat4x4: MatrixLike
  texture: Texture
  sampler: SamplerState
}

export type InputBlockName = Brand<string, 'InputBlockName'>

export type InputKey = Brand<string, 'InputKey'>

export type InputSlot<T extends InputTypeName = InputTypeName> = {
  readonly key: InputKey
  readonly block: InputBlockName
  readonly input: string
  readonly type: T
}

export function inputKey(block: string, input: string): InputKey {
  return (block ? `${block}.${input}` : input) as InputKey
}

export function inputSlotScalar(block: string, input: string): InputSlot<'scalar'> {
  return inputSlot(block, input, 'scalar')
}

export function inputSlotTexture(block: string, input: string): InputSlot<'texture'> {
  return inputSlot(block, input, 'texture')
}

export function inputSlotSampler(block: string, input: string): InputSlot<'sampler'> {
  return inputSlot(block, input, 'sampler')
}

export function inputSlotVec2(block: string, input: string): InputSlot<'vec2'> {
  return inputSlot(block, input, 'vec2')
}

export function inputSlotVec3(block: string, input: string): InputSlot<'vec3'> {
  return inputSlot(block, input, 'vec3')
}

export function inputSlotVec4(block: string, input: string): InputSlot<'vec4'> {
  return inputSlot(block, input, 'vec4')
}

export function inputSlotMat2(block: string, input: string): InputSlot<'mat2x2'> {
  return inputSlot(block, input, 'mat2x2')
}

export function inputSlotMat3(block: string, input: string): InputSlot<'mat3x3'> {
  return inputSlot(block, input, 'mat3x3')
}

export function inputSlotMat4(block: string, input: string): InputSlot<'mat4x4'> {
  return inputSlot(block, input, 'mat4x4')
}

export function inputSlot<T extends InputTypeName>(block: string, input: string, type: T): InputSlot<T> {
  return {
    key: inputKey(block || '', input),
    block: block as InputBlockName,
    input,
    type,
  }
}

export abstract class ProgramInput {
  /**
   * The name of this input
   */
  public abstract readonly name: string

  /**
   * The data type name of this input as declared in the shader
   */
  public abstract readonly type: InputTypeName

  /**
   * Sets the value using the appropriate setter for this input's type.
   */
  public abstract set(value: InputValueType): void

  /** Sets a scalar number value */
  public abstract setScalar(value: number): void

  /** Sets an array of numbers, with an optional starting offset */
  public abstract setArray(value: ArrayLike<number>, offset?: number): void

  /** Sets a 2-component vector value */
  public abstract setVec2(value: IVec2 | ArrayLike<number>): void

  /** Sets a 3-component vector value */
  public abstract setVec3(value: IVec3 | ArrayLike<number>): void

  /** Sets a 4-component vector value */
  public abstract setVec4(value: IVec4 | ArrayLike<number>): void

  /** Sets a 2x2 matrix value */
  public abstract setMat2x2(value: MatrixLike): void

  /** Sets a 3x3 matrix value */
  public abstract setMat3x3(value: MatrixLike): void

  /** Sets a 4x4 matrix value */
  public abstract setMat4x4(value: MatrixLike): void

  /** Sets the texture resource for this input */
  public abstract setTexture(value: Texture): void

  /** Sets the sampler state for this input */
  public abstract setSampler(value: SamplerState): void

  /**
   * Binds a GPU buffer directly to this input, replacing the current buffer resource.
   *
   * @remarks
   * Use this to bind an externally managed buffer - for example, an instance data buffer
   * or a shared uniform buffer. The original CPU-side data and any child field states are
   * preserved; only the GPU resource binding is replaced.
   */
  public abstract setBuffer(value: Buffer): void

  /**
   * Gets the raw CPU side value currently stored in this input
   * This is meant for debugging and testing purposes
   */
  public abstract get rawValue(): unknown
}
