import { Triangle } from './Triangle'
import { Vertex } from './Vertex'
import { Weight } from './Weight'

export interface Mesh {
  /**
   * The name of the mesh
   */
  name?: string

  /**
   * The material name that is assigent to this mesh
   */
  shader: string

  /**
   * Collection of vertices describing this mesh
   */
  vert: Vertex[]

  /**
   * Collection of triangles describing this mesh
   */
  tri: Triangle[]

  /**
   * Collection of weights for skinning animation
   */
  weight: Weight[]
}
