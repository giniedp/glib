import { Mat4 } from '@gglib/math'

export interface ModelSkin {
  joints: number[]
  bindMatrices: Mat4[]
  inverseBindMatrices: Mat4[]
}
