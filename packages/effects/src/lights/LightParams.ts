import { LightType } from '@gglib/graphics'
import { IVec3 } from '@gglib/math'

export class LightParams {

  /**
   * Color of the light source
   *
   * @remarks
   * This is the color intensity that will be used in the shader.
   */
  public get color(): ArrayLike<number> {
    return this.$color
  }
  public set color(v: ArrayLike<number>) {
    this.$color[0] = v[0]
    this.$color[1] = v[1]
    this.$color[2] = v[2]
    if (v.length > 3) {
      this.$color[4] = v[4]
    }
  }

  /**
   * Position of the light source
   *
   * @remarks
   * Applicable to all light types except directional light
   */
  public get position(): ArrayLike<number> {
    return this.$position
  }
  public set position(v: ArrayLike<number>) {
    this.$position[0] = v[0]
    this.$position[1] = v[1]
    this.$position[2] = v[2]
    if (v.length > 3) {
      this.$position[4] = v[4]
    }
  }

  /**
   * Direction of the light source
   *
   * @remarks
   * Applicable to all light types except point light
   */
  public get direction(): ArrayLike<number> {
    return this.$direction
  }
  public set direction(v: ArrayLike<number>) {
    this.$direction[0] = v[0]
    this.$direction[1] = v[1]
    this.$direction[2] = v[2]
    if (v.length > 3) {
      this.$direction[4] = v[4]
    }
  }

  /**
   * Gets and sets the light type
   */
  public get type() {
    return this.$type
  }
  public set type(v: LightType) {
    this.$type = v
    this.enabled = this.enabled // updates value in buffer
  }

  /**
   * Enables or disables the light source
   */
  public get enabled(): boolean {
    return this.$color[3] > 0
  }
  public set enabled(v: boolean) {
    this.$color[3] = v ? this.$type : 0
  }

  /**
   * Gets and sets the width of the light source rectangle
   *
   * @remarks
   * only applicable to area light types
   */
  public get width() {
    return this.$position[3]
  }
  public set width(v: number) {
    this.$position[3] = v
  }

  /**
   * Gets and sets the height of the light source rectangle
   *
   * @remarks
   * only applicable to area light types
   */
  public get height() {
    return this.$direction[3]
  }
  public set height(v: number) {
    this.$direction[3] = v
  }

  /**
   * Gets and sets the range of the light source
   *
   * @remarks
   * Only applicable to point light and spot light types
   */
  public get range() {
    return this.$position[3]
  }
  public set range(v: number) {
    this.$position[3] = v
  }

  /**
   * Gets and sets the angle in degree of the light source
   *
   * @remarks
   * Only applicable to spot light type
   */
  public get angle() {
    return (Math.acos(this.$direction[3]) * 180) / Math.PI
  }
  public set angle(v: number) {
    this.$direction[3] = Math.cos(v * Math.PI / 180)
  }

  private $type = LightType.Directional
  private $color: Float32Array
  private $position: Float32Array
  private $direction: Float32Array

  public readonly data: Float32Array

  public constructor() {
    this.data = new Float32Array([
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
    ])
    this.$color = this.data.subarray(0, 4)
    this.$position = this.data.subarray(4, 8)
    this.$direction = this.data.subarray(8, 12)
  }

  public setPosition(v: IVec3) {
    this.$position[0] = v.x
    this.$position[1] = v.y
    this.$position[2] = v.z
  }

  public setDirection(v: IVec3) {
    this.$direction[0] = v.x
    this.$direction[1] = v.y
    this.$direction[2] = v.z
  }

  public setColor(v: IVec3, intensity = 1) {
    this.$color[0] = v.x * intensity
    this.$color[1] = v.y * intensity
    this.$color[2] = v.z * intensity
  }

  public write(buffer: Float32Array, offset: number) {
    for (let i = 0; i < this.data.length; i++) {
      buffer[offset + i] = this.data[i]
    }
  }

  public assign(lightIndex: number, toParams: { [k: string]: any }) {
    toParams[`Lights${lightIndex}Color`] = this.$color
    toParams[`Lights${lightIndex}Position`] = this.$position
    toParams[`Lights${lightIndex}Direction`] = this.$direction
  }
}
