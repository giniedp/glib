import type { Buffer, InputTypeName, Texture } from '../../resources'
import type { SamplerState } from '../../states'

export interface WebglUniform {
  /**
   * The name of this uniform as declared in the shader.
   * For array uniforms, this will include the array suffix (e.g. 'myUniform[0]').
   */
  name: string
  /**
   * The alias of this uniform as it may be referenced from JS code.
   * Aliases may be declared as comments in the shader source code
   */
  alias: string
  /**
   * The type of this uniform (e.g. 'vec3', 'mat4x4', 'sampler', etc.)
   */
  type: InputTypeName
  /**
   * Jumps to the specified array index for this uniform.
   * For non-array uniforms, this should be called with index 0.
   */
  beginWrite(index: number): void
  /**
   * Writes the given value to this uniform at the current position.
   * For array uniforms, this will write to the current array index as set by {@link beginWrite}.
   */
  write(value: number): void
  /**
   * Signals that all writes for the current update have been completed and the uniform can be committed to the GPU.
   */
  endWrite(): void
  /**
   * Sets the texture for this uniform
   */
  setTexture(value: Texture): void
  /**
   * Sets the sampler for this uniform
   */
  setSampler(value: SamplerState): void

  setBuffer(value: Buffer): void

  readValue(index: number, size: number): unknown
}
