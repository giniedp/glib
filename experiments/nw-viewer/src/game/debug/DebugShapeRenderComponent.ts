import { MeshComponent } from '@gglib/components'
import { GameEntity, type GameComponent } from '@gglib/ecs'
import {
  boxGeometry,
  boxLinesGeometry,
  bufferLayout,
  Device,
  planeGeometry,
  planeLinesGeometry,
  sphereGeometry,
  sphereLinesGeometry,
  type InstancedMesh,
} from '@gglib/graphics'
import type { DebugShapeType } from './DebugShapeComponent'

export type DebugShapeBufferLayout = typeof DebugShapeBufferLayout
export const DebugShapeBufferLayout = bufferLayout([
  { name: 'position', type: 'vec4' },
  { name: 'scale', type: 'vec4' },
  { name: 'color', type: 'vec4' },
])

export type DebugShapeMesh = InstancedMesh<DebugShapeBufferLayout>

export class DebugShapeRenderComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly shapes: Record<string, MeshComponent<DebugShapeMesh>> = {}
}

export function createShapeGeometry(device: Device, type: DebugShapeType, solid: boolean) {
  switch (type) {
    case 'sphere': {
      if (solid) {
        return sphereGeometry(device, {
          materialId: 0,
          radius: 1,
          stacks: 4,
          slices: 8,
        })
      }
      return sphereLinesGeometry(device, {
        materialId: 0,
        radius: 1,
        stacks: 4,
        slices: 8,
      })
    }
    case 'box': {
      if (solid) {
        return boxGeometry(device, {
          materialId: 0,
          size: 1,
        })
      }
      return boxLinesGeometry(device, {
        materialId: 0,
        size: 1,
      })
    }
    case 'plane': {
      if (solid) {
        return planeGeometry(device, {
          size: 1,
        })
      }
      return planeLinesGeometry(device, {
        size: 1,
        depthSegments: 2,
        widthSegments: 2,
      })
    }
    default: {
      throw new Error(`Unsupported shape type: ${type}`)
    }
  }
}
