import { MeshComponent } from '@gglib/components'
import { GameEntity, type GameComponent } from '@gglib/ecs'
import { boxGeometry, Device, planeGeometry, sphereGeometry } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import type { DebugMesh } from './DebugMesh'
import type { DebugShapeType } from './DebugShapeComponent'

export class DebugShapeRenderComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly shapes: Record<string, MeshComponent<DebugMesh>> = {}
}

export function createShapeGeometry(device: Device, type: DebugShapeType, solid: boolean) {
  switch (type) {
    case 'sphere': {
      return sphereGeometry(device, {
        vertexTransform: Mat4.createRotationX(Math.PI / 2), // rotate to z up
        radius: 1,
        stacks: 4,
        slices: 8,
        lines: !solid,
      })
    }
    case 'box': {
      return boxGeometry(device, {
        vertexTransform: Mat4.createRotationX(Math.PI / 2), // rotate to z up
        size: 1,
        lines: !solid,
      })
    }
    case 'plane': {
      return planeGeometry(device, {
        vertexTransform: Mat4.createRotationX(Math.PI / 2), // rotate to z up
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
