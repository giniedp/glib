import { BasicMaterial, CommonInputs, Device, Geometry, Mesh, Texture, TRUE } from '@gglib/graphics'
import { IVec3, mat4CreateTranslation, mat4Identity } from '@gglib/math'
import {
  CameraData,
  isRenderItem,
  LayerMask,
  MeshRenderItem,
  RenderItem,
  RenderItemFlags,
  RenderItemType,
  RenderScene,
} from '@gglib/render'

export interface Scene extends RenderScene {
  items: RenderItem[]
}

export function createScene(): Scene {
  const scene: Scene = {
    items: [],
    views: [],
    output: null,
    collect: (frame, camera, out) => {
      for (const item of scene.items) {
        if (isRenderItem(item, RenderItemType.Mesh)) {
          item.data.materials[0].setInput(CommonInputs.Object.ModelMatrix, item.transform)
        }
        out.push(item)
      }
    },
  }

  return scene
}

export function createCamera(data?: Partial<CameraData>): CameraData {
  return {
    visibilityMask: LayerMask.All,
    world: mat4Identity(),
    view: mat4Identity(),
    projection: mat4Identity(),
    reversedZ: false,
    near: 0.1,
    far: 100,
    ...(data || {}),
  }
}

export function createObject(device: Device, texture: Texture, geometry: Geometry, position: IVec3): RenderItem {
  const material = new BasicMaterial(device, { properties: {} })
  material.BaseMap = texture
  material.UseBaseMap = TRUE
  return {
    type: RenderItemType.Mesh,
    layer: LayerMask.All,
    flags: RenderItemFlags.Opaque,
    transform: mat4CreateTranslation(position),
    data: new Mesh(device, {
      materials: [material],
      geometries: [geometry],
      parts: [
        {
          geometryIndex: 0,
          materialIndex: 0,
        },
      ],
    }),
  } satisfies MeshRenderItem
}
