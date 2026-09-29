import { IVec2 } from '@gglib/math'

export interface Vertex {
  /**
   * The index of this vertex
   */
  index: number
  /**
   * The texture coordinate at this vertex
   */
  uv: IVec2
  /**
   * The index into the weight array where this vertex’s first weight is located.
   */
  weightIndex: number
  /**
   * The number of elements in the weight array that apply to this vertex.
   */
  weightCount: number
}
