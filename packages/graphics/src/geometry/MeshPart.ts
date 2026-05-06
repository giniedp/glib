import { IVec4 } from '@gglib/math'
import { Material } from '../effects'
import { Geometry } from './Geometry'

export interface MeshPart {
  geometry: Geometry
  material: Material
  instanced?: boolean
  instanceData1?: IVec4
  instanceData2?: IVec4
}
