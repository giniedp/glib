import { Mat4, mat4$setForward, mat4$setRight, mat4$setUp, mat4Identity, mat4Transpose } from './Mat4'
import { IVec3 } from './Types'
import { vec3, vec3Negate } from './Vec3'

/**
 * Defines the axes of a 3D coordinate space.
 *
 * Used to construct a {@link SpaceBasis} from three orthonormal vectors.
 * All vectors must be unit length and mutually perpendicular.
 */
export interface SpaceDefinition {
  up: Readonly<IVec3>
  right: Readonly<IVec3>
  forward: Readonly<IVec3>
}

/**
 * Describes a right-handed 3D coordinate space in terms of its cardinal axes.

 */
export class SpaceBasis {
  /**
   * Right-handed, Y-up, -Z forward.
   *
   * The GPU view space convention. Also the native space of most real-time
   * graphics APIs and asset formats.
   *
   * Used by: OpenGL, WebGL, WebGPU, glTF, FBX (default export), Maya, Houdini,
   * Godot, Bevy, three.js, Babylon.js, VRML/X3D
   */
  public static Y_UP_NEG_Z = new SpaceBasis({
    up: vec3(0, 1, 0),
    right: vec3(1, 0, 0),
    forward: vec3(0, 0, -1),
  })

  /**
   * Right-handed, Z-up, +Y forward.
   *
   * Common in game engines with roots in the FPS genre, where the ground
   * plane is XY and height is Z.
   *
   * Used by: CryEngine, 3ds Max, Autodesk FBX (Z-up option), Valve Source, Quake/idTech
   */
  public static Z_UP_POS_Y = new SpaceBasis({
    up: vec3(0, 0, 1),
    right: vec3(1, 0, 0),
    forward: vec3(0, 1, 0),
  })

  /**
   * Right-handed, Z-up, -Y forward.
   *
   * Blender's native world space. Assets exported from Blender without
   * axis correction will be in this space.
   *
   * Used by: Blender
   */
  public static Z_UP_NEG_Y = new SpaceBasis({
    up: vec3(0, 0, 1),
    right: vec3(1, 0, 0),
    forward: vec3(0, 0, -1),
  })

  /**
   * World up axis. Use as the rotation axis for horizontal (yaw-like) rotation.
   */
  public readonly up: Readonly<IVec3>

  /**
   * World right axis. Use as the rotation axis for vertical (pitch-like) rotation.
   */
  public readonly right: Readonly<IVec3>

  /**
   * World forward axis. The direction a camera faces at identity rotation.
   */
  public readonly forward: Readonly<IVec3>

  /**
   *  Opposite of {@link up}.
   */
  public readonly down: Readonly<IVec3>

  /**
   * Opposite of {@link right}.
   */
  public readonly left: Readonly<IVec3>

  /**
   * Opposite of {@link forward}.
   */
  public readonly backward: Readonly<IVec3>

  /**
   * Rotation from GPU view space (Y-up, -Z forward) into this world space.
   *
   * Apply to asset root transforms when importing geometry authored in
   * Y-up space (glTF, FBX default) into a non-Y-up world.
   */
  public readonly fromViewSpace: Mat4

  /**
   * Rotation from this world space into GPU view space (Y-up, -Z forward).
   *
   * Apply to the view matrix before uploading to the GPU so that shaders
   * always receive Y-up, -Z forward view coordinates:
   *
   * ```ts
   * mat4Invert(world, view)
   * mat4Premultiply(view, space.toViewSpace, view)
   * ```
   *
   * Is the transpose of {@link fromViewSpace}.
   */
  public readonly toViewSpace: Mat4

  public constructor(definition: SpaceDefinition) {
    this.up = vec3(definition.up)
    this.right = vec3(definition.right)
    this.forward = vec3(definition.forward)

    this.down = vec3Negate(this.up)
    this.left = vec3Negate(this.right)
    this.backward = vec3Negate(this.forward)

    this.fromViewSpace = mat4Identity()
    mat4$setUp(this.fromViewSpace, this.up)
    mat4$setRight(this.fromViewSpace, this.right)
    mat4$setForward(this.fromViewSpace, this.forward)

    this.toViewSpace = mat4Transpose(this.fromViewSpace)
  }
}
