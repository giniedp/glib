import type { IVec2, IVec3, IVec4 } from '@gglib/math'
import type { SamplerState } from '../states'
import type { Texture } from './Texture'
import { Buffer } from './Buffer'

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
  /**
   * The name of this input as declared in the shader
   */
  public abstract readonly name: string

  /**
   * The data type of this input as declared in the shader
   */
  public abstract readonly type: ProgramInputType

  /**
   * Sets the value using the appropriate setter for this input's type.
   */
  public abstract set(value: ProgramInputValue): void

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
   * Marks the resource as changed, so it will be committed to the GPU before the next draw or dispatch call.
   *
   * @remarks
   * Only needs to be called when the input was changed from outside without using the provided setter methods,
   * e.g. when modifying a texture or buffer directly.
   */
  // public abstract markAsChanged(): void
}
