import { LightType } from '@gglib/graphics'

export class LightParams {

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
  }

  /**
   * Enables or disables the light source
   */
  public get enabled(): boolean {
    return this.dataRow1[3] > 0
  }
  public set enabled(v: boolean) {
    this.dataRow1[3] = v ? this.$type : 0
  }

  /**
   * Gets and sets the width of the light source rectangle
   *
   * @remarks
   * only applicable to area light types
   */
  public get width() {
    return this.dataRow2[3]
  }
  public set width(v: number) {
    this.dataRow2[3] = v
  }

  /**
   * Gets and sets the height of the light source rectangle
   *
   * @remarks
   * only applicable to area light types
   */
  public get height() {
    return this.dataRow3[3]
  }
  public set height(v: number) {
    this.dataRow3[3] = v
  }

  /**
   * Gets and sets the range of the light source
   *
   * @remarks
   * Only applicable to point light and spot light types
   */
  public get range() {
    return this.dataRow2[3]
  }
  public set range(v: number) {
    this.dataRow2[3] = v
  }

  /**
   * Gets and sets the angle in degree of the light source
   *
   * @remarks
   * Only applicable to spot light type
   */
  public get angle() {
    return (Math.acos(this.dataRow3[3]) * 180) / Math.PI
  }
  public set angle(v: number) {
    this.dataRow3[3] = Math.cos(v * Math.PI / 180)
  }

  private $type = LightType.Directional
  private $color: Float32Array
  private $position: Float32Array
  private $direction: Float32Array

  protected readonly data: Float32Array
  protected readonly dataRow1: Float32Array
  protected readonly dataRow2: Float32Array
  protected readonly dataRow3: Float32Array

  public constructor() {
    this.data = new Float32Array([
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
    ])
    this.dataRow1 = this.data.subarray(0, 4)
    this.dataRow2 = this.data.subarray(4, 8)
    this.dataRow3 = this.data.subarray(8, 12)
    this.$color = this.dataRow1.subarray(0, 3)
    this.$position = this.dataRow2.subarray(0, 3)
    this.$direction = this.dataRow3.subarray(0, 3)
  }

  public write(buffer: Float32Array, offset: number) {
    for (let i = 0; i < this.data.length; i++) {
      buffer[offset + i] = this.data[i]
    }
  }

  public assign(lightIndex: number, toParams: { [k: string]: any }) {
    toParams[`Lights${lightIndex}Color`] = this.dataRow1
    toParams[`Lights${lightIndex}Position`] = this.dataRow2
    toParams[`Lights${lightIndex}Direction`] = this.dataRow3
  }
}
