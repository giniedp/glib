import { GLTFProperty, GLTFRootProperty } from './common'

/**
 * Array of size `accessor.sparse.count` times number of components storing
 * the displaced accessor attributes pointed by `accessor.sparse.indices`.
 */
export interface GLTFAccessorSparseValues extends GLTFProperty {
  /**
   * The index of the bufferView with sparse values.
   * Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
   */
  bufferView: number

  /**
   * The offset relative to the start of the bufferView in bytes. Must be aligned.
   */
  byteOffset?: number
}

export enum GLTFAccessorSparseComponentType {
  UNSIGNED_BYTE = 5121,
  UNSIGNED_SHORT = 5123,
  UNSIGNED_INT = 5125,
}

/**
 * Indices of those attributes that deviate from their initialization value.
 */
export interface GLTFAccessorSparseIndices extends GLTFProperty {
  /**
   * The index of the bufferView with sparse indices.
   * Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
   */
  bufferView: number

  /**
   * The offset relative to the start of the bufferView in bytes. Must be aligned.
   */
  byteOffset?: number

  /**
   * The indices data type.
   *
   * @remarks
   * The indices data type.  Valid values correspond to WebGL enums: `5121` (UNSIGNED_BYTE), `5123` (UNSIGNED_SHORT), `5125` (UNSIGNED_INT).
   */
  componentType: GLTFAccessorSparseComponentType
}

/**
 * Sparse storage of attributes that deviate from their initialization value.
 */
export interface GLTFAccessorSparse extends GLTFProperty {
  /**
   * Number of entries stored in the sparse array.
   *
   * @remarks
   * The number of attributes encoded in this sparse accessor.
   */
  count: number

  /**
   * Index array of size `count` that points to those accessor attributes that deviate from their initialization value.
   * Indices must strictly increase.
   */
  indices: GLTFAccessorSparseIndices

  /**
   * Array of size `count` times number of components, storing the displaced accessor attributes pointed by `indices`.
   * Substituted values must have the same `componentType` and number of components as the base accessor.
   */
  values: GLTFAccessorSparseValues
}

export enum GLTFAccessorComponentType {
  BYTE = 5120,
  UNSIGNED_BYTE = 5121,
  SHORT = 5122,
  UNSIGNED_SHORT = 5123,
  UNSIGNED_INT = 5125,
  FLOAT = 5126,
}

export type GLTFAccessorType = 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4'

/**
 * A typed view into a bufferView. A bufferView contains raw binary data.
 * An accessor provides a typed view into a bufferView or a subset of a bufferView
 * similar to how WebGL's `vertexAttribPointer()` defines an attribute in a buffer.
 */
export interface GLTFAccessor extends GLTFRootProperty {
  /**
   * The index of the bufferView.
   *
   * @remarks
   * The index of the bufferView. When not defined, accessor must be initialized with zeros;
   * `sparse` property or extensions could override zeros with actual values.
   */
  bufferView?: number

  /**
   * The offset relative to the start of the bufferView in bytes.
   *
   * @remarks
   * This must be a multiple of the size of the component datatype.
   */
  byteOffset?: number

  /**
   * The datatype of components in the attribute.
   *
   * @remarks
   * All valid values correspond to WebGL enums.  The corresponding typed arrays are
   * `Int8Array`, `Uint8Array`, `Int16Array`, `Uint16Array`, `Uint32Array`, and `Float32Array`, respectively.
   * 5125 (UNSIGNED_INT) is only allowed when the accessor contains indices, i.e., the accessor is only referenced by `primitive.indices`.
   */
  componentType: GLTFAccessorComponentType

  /**
   * Specifies whether integer data values should be normalized.
   *
   * @remarks
   * Specifies whether integer data values should be normalized (`true`) to [0, 1] (for unsigned types)
   * or [-1, 1] (for signed types), or converted directly (`false`) when they are accessed.
   * This property is defined only for accessors that contain vertex attributes or animation output data.
   */
  normalized?: boolean

  /**
   * The number of attributes referenced by this accessor.
   *
   * @remarks
   * The number of attributes referenced by this accessor, not to be confused with the number of bytes or number of components.
   */
  count: number

  /**
   * Specifies if the attribute is a scalar, vector, or matrix.
   */
  type: GLTFAccessorType

  /**
   * Maximum value of each component in this attribute.
   *
   * @remarks
   * Array elements must be treated as having the same data type as accessor's `componentType`.
   * Both min and max arrays have the same length. The length is determined by the value of the type property;
   * it can be 1, 2, 3, 4, 9, or 16.
   *
   * `normalized` property has no effect on array values: they always correspond to the actual values stored in the buffer.
   * When accessor is sparse, this property must contain max values of accessor data with sparse substitution applied.
   */
  max?: number[]

  /**
   * Minimum value of each component in this attribute.
   *
   * @remarks
   * Array elements must be treated as having the same data type as accessor's `componentType`.
   * Both min and max arrays have the same length.  The length is determined by the value of the type property;
   * it can be 1, 2, 3, 4, 9, or 16.
   *
   * `normalized` property has no effect on array values: they always correspond to the actual values stored in the buffer.
   * When accessor is sparse, this property must contain min values of accessor data with sparse substitution applied.
   */
  min?: number[]

  /**
   * Sparse storage of attributes that deviate from their initialization value.
   */
  sparse?: GLTFAccessorSparse
}
