import { GLTFProperty, GLTFRootProperty } from './common'

/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 */
export interface GLTFCameraOrthographic {
  /**
   * The floating-point horizontal magnification of the view. Must not be zero.
   */
  xmag: number

  /**
   * The floating-point vertical magnification of the view. Must not be zero.
   */
  ymag: number

  /**
   * The floating-point distance to the far clipping plane. `zfar` must be greater than `znear`.
   */
  zfar: number

  /**
   * The floating-point distance to the near clipping plane.
   */
  znear: number
}

/**
 * A perspective camera containing properties to create a perspective projection matrix.
 */
export interface GLTFCameraPerspective extends GLTFProperty {
  /**
   * The floating-point aspect ratio of the field of view.
   *
   * @remarks
   * The floating-point aspect ratio of the field of view. When this is undefined, the aspect ratio of the canvas is used.
   */
  aspectRatio?: number

  /**
   * The floating-point vertical field of view in radians.
   */
  yfov: number

  /**
   * The floating-point distance to the far clipping plane.
   *
   * @remarks
   * The floating-point distance to the far clipping plane.
   * When defined, `zfar` must be greater than `znear`.
   * If `zfar` is undefined, runtime must use infinite projection matrix.
   */
  zfar: number

  /**
   * The floating-point distance to the near clipping plane.
   */
  znear?: number
}

export interface GLTFCamera extends GLTFRootProperty {
  /**
   * An orthographic camera containing properties to create an orthographic projection matrix.
   */
  orthographic?: GLTFCameraOrthographic

  /**
   * A perspective camera containing properties to create a perspective projection matrix.
   */
  perspective?: GLTFCameraPerspective

  /**
   * pecifies if the camera uses a perspective or orthographic projection.
   */
  type: 'perspective' | 'orthographic'
}
