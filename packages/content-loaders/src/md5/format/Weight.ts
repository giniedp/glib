export interface Weight {
  /**
   * The index of this weight.
   */
  index: number
  /**
   * The index of the joint to which this weight applies.
   */
  jointIndex: number
  /**
   * The value of the weight.
   */
  value: number
  /**
   * The weights position
   */
  position: { x: number, y: number, z: number },
}
