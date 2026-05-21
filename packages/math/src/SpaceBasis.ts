import { Mat4 } from './Mat4'
import { IVec3 } from './Types'
import { Vec3 } from './Vec3'

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
    up: Vec3.UnitY,
    right: Vec3.UnitX,
    forward: Vec3.NegativeUnitZ,
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
    up: Vec3.UnitZ,
    right: Vec3.UnitX,
    forward: Vec3.UnitY,
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
    up: Vec3.UnitZ,
    right: Vec3.UnitX,
    forward: Vec3.NegativeUnitY,
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
   * Mat4.invert(world, view)
   * Mat4.premultiply(view, space.toViewSpace, view)
   * ```
   *
   * Is the transpose of {@link fromViewSpace}.
   */
  public readonly toViewSpace: Mat4

  public constructor(definition: SpaceDefinition) {
    this.up = Vec3.clone(definition.up)
    this.right = Vec3.clone(definition.right)
    this.forward = Vec3.clone(definition.forward)

    this.down = Vec3.negate(this.up)
    this.left = Vec3.negate(this.right)
    this.backward = Vec3.negate(this.forward)

    this.fromViewSpace = Mat4.createIdentity()
    this.fromViewSpace.setUp(this.up)
    this.fromViewSpace.setRight(this.right)
    this.fromViewSpace.setForward(this.forward)

    this.toViewSpace = Mat4.transpose(this.fromViewSpace)
  }
}
