import { Mat4 } from '@gglib/math'

export interface ModelSkin {
  joints: number[]
  inverseBindMatrices: Mat4[]
}
