import { MeshComponent } from '@gglib/components'
import { GameEntity, type GameComponent } from '@gglib/ecs'
import { boxGeometry, bufferLayout, Device, planeGeometry, sphereGeometry, type InstancedMesh } from '@gglib/graphics'
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
      return sphereGeometry(device, {
        radius: 1,
        stacks: 4,
        slices: 8,
        lines: !solid,
      })
    }
    case 'box': {
      return boxGeometry(device, {
        size: 1,
        lines: !solid,
      })
    }
    case 'plane': {
      return planeGeometry(device, {
        size: 1,
        depthSegments: 2,
        widthSegments: 2,
        lines: !solid,
      })
    }
    default: {
      throw new Error(`Unsupported shape type: ${type}`)
    }
  }
}
