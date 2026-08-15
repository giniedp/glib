import { ContentLoader } from '@gglib/content'
import { TonemapOperator } from '@gglib/effects'
import {
  CommonMaterial,
  boxGeometry,
  createDevice,
  Mesh,
  PlatformId,
  TaskContext,
  Texture,
  TRUE,
} from '@gglib/graphics'
import { HDR } from '@gglib/loaders'
import { DEGREE_TO_RAD, Mat4, Vec3, vec3 } from '@gglib/math'

import {
  CameraData,
  LayerMask,
  MeshRenderItem,
  Renderer,
  RenderItemFlags,
  RenderItemType,
  RenderScene,
  TonemapPass,
} from '@gglib/render'
import { mountUi, redrawUi } from 'tweak-ui'

const files = {
  Court: '/textures/hdr/footprint_court.hdr',
  Exterior: '/textures/hdr/cannon_exterior.hdr',
  Overcast: '/textures/hdr/overcast_puresky.hdr',
  Memorial: '/textures/hdr/memorial.hdr',
}
const params = {
  fov: 45,
  texture: files.Court,
}
export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready

  const renderer = new Renderer(device)
  const content = new ContentLoader(device)
  const tonemap = new TonemapPass(device, {
    enabled: true,
    autoExposure: false,
  })

  content.registerLoader(HDR.Loader)
  renderer.pipeline.passes.push(tonemap)

  const camera: CameraData = {
    visibilityMask: LayerMask.All,
    world: Mat4.createIdentity().translateXYZ(5, 5, 15),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
    reversedZ: false,
    near: 0.1,
    far: 100,
  }

  const scene: RenderScene & { items: MeshRenderItem[] } = {
    items: [],
    views: [
      renderer.createView({
        name: 'main',
        camera,
      }),
    ],
    output: null,
    collect: (frame, camera, out) => {
      for (const item of scene.items) {
        out.push(item)
      }
    },
  }

  const geometry = boxGeometry(device)
  const material = new CommonMaterial(device)
  let texture: Texture

  scene.items.push({
    type: RenderItemType.Mesh,
    flags: RenderItemFlags.Opaque,
    layer: 0,
    transform: Mat4.createIdentity(),
    data: new Mesh(device, {
      materials: [material],
      partImports: [
        {
          geometry,
          materialIndex: 0,
        },
      ],
    }),
  })

  function frame(ctx: TaskContext) {
    device.resize()

    const view = scene.views[0]
    view.camera.world.initLookAt(vec3(0, 0, 2), Vec3.Zero, Vec3.UnitY)
    Mat4.invert(view.camera.world, view.camera.view)

    view.camera.reversedZ = false
    view.camera.projection.initPerspectiveFieldOfView(
      params.fov * DEGREE_TO_RAD,
      device.output.aspectRatio,
      view.camera.near,
      view.camera.far,
      device.ndcMinZ,
      false,
    )

    for (const item of scene.items) {
      const material = item.data.materials[0] as CommonMaterial
      if (texture) {
        material.Texture = texture
        material.TextureEnabled = TRUE
        item.transform.initScaleXYZ(1, texture.height / texture.width, 1)
      }
      material.World = item.transform
    }

    renderer.update(ctx.time)
    renderer.render(scene)
  }

  function loadTexture(url: string) {
    content
      .loadTexture(url)
      .then((result) => {
        texture = result
        redrawUi()
      })
      .catch((e) => {
        console.error(e)
      })
  }

  mountUi(tools, (ui) => {
    loadTexture(params.texture)
    ui.select(params, 'texture', {
      options: files,
      onchange: () => loadTexture(params.texture),
    })
    ui.scalar(params, 'fov', { range: true, min: 1, max: 179 })
    ui.group('Tonemap Pass', (ui) => {
      ui.bool(tonemap, 'enabled')
      ui.bool(tonemap, 'autoExposure')
      ui.scalar(tonemap, 'adaptSpeed', { range: true, min: 0, max: 1 })
      ui.scalar(tonemap, 'whitePoint', { range: true, min: 0, max: 2 })
      ui.scalar(tonemap, 'exposure', { range: true, min: 0, max: 10 })
      ui.select(tonemap, 'operator', {
        options: TonemapOperator,
      })
    })
  })

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
