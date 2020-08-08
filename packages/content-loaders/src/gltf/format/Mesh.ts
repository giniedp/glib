import { PrimitiveType } from '@gglib/graphics'
import { GLTFProperty, GLTFRootProperty } from './common'

/**
 * A dictionary object specifying attributes displacements in a Morph Target,
 * where each key corresponds to one of the three supported attribute semantic
 * (`POSITION`, `NORMAL`, or `TANGENT`) and each value is the index of the
 * accessor containing the attribute displacements' data.
 */
export interface GLTFMorphTarget {
  POSITION: number
  NORMAL: number
  TANGENT: number
}

/**
 * Geometry to be rendered with the given material.
 */
export interface GLTFMeshPrimitive extends GLTFProperty {
  /**
   * A dictionary object, where each key corresponds to mesh attribute semantic and each value
   * is the index of the accessor containing attribute's data.
   */
  attributes: { [key: string]: number }

  /**
   * The index of the accessor that contains the indices.
   *
   * @remarks
   * The index of the accessor that contains mesh indices.
   * When this is not defined, the primitives should be rendered without indices using `drawArrays()`.
   * When defined, the accessor must contain indices: the `bufferView` referenced by the accessor
   * should have a `target` equal to 34963 (ELEMENT_ARRAY_BUFFER);
   *
   * `componentType` must be 5121 (UNSIGNED_BYTE), 5123 (UNSIGNED_SHORT) or 5125 (UNSIGNED_INT),
   * the latter may require enabling additional hardware support; `type` must be `\"SCALAR\"`.
   * For triangle primitives, the front face has a counter-clockwise (CCW) winding order.
   */
  indices?: number

  /**
   * The index of the material to apply to this primitive when rendering.
   */
  material?: number

  /**
   * The type of primitives to render. All valid values correspond to WebGL enums.
   */
  mode?: PrimitiveType

  /**
   * An array of Morph Targets, each  Morph Target is a dictionary mapping attributes
   * (only `POSITION`, `NORMAL`, and `TANGENT` supported) to their deviations in the Morph Target.
   */
  targets?: GLTFMorphTarget[]
}

/**
 * A set of primitives to be rendered.  A node can contain one mesh.  A node's transform places the mesh in the scene.
 */
export interface GLTFMesh extends GLTFRootProperty {
  /**
   * An array of primitives, each defining geometry to be rendered with a material.
   */
  primitives: GLTFMeshPrimitive[]

  /**
   * Array of weights to be applied to the Morph Targets.
   */
  weights?: number[]
}
