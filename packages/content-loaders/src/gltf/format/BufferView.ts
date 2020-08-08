import { GLTFRootProperty } from './common'

export enum GLTFBufferViewTarget {
  ARRAY_BUFFER = 34962,
  ELEMENT_ARRAY_BUFFER = 34963,
}

/**
 * A view into a buffer generally representing a subset of the buffer.
 */
export interface GLTFBufferView extends GLTFRootProperty {

  /**
   * The index of the buffer.
   */
  buffer: number

  /**
   * The offset into the buffer in bytes.
   */
  byteOffset?: number

  /**
   * The length of the bufferView in bytes.
   */
  byteLength: number

  /**
   * The stride, in bytes.
   *
   * @remarks
   * The stride, in bytes, between vertex attributes.  When this is not defined, data is tightly packed.
   * When two or more accessors use the same bufferView, this field must be defined.
   */
  byteStride?: number

  /**
   * The target that the GPU buffer should be bound to.
   */
  target?: GLTFBufferViewTarget
}
