import { ContentLoader } from '@gglib/content'
import {
  CommonMaterial,
  createDevice,
  cubeGeometry,
  Device,
  Mesh,
  PlatformId,
  TaskContext,
  Texture,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, MT19937, Vec3 } from '@gglib/math'
import { Random } from '@gglib/math'
import {
  LayerMask,
  MeshRenderItem,
  Renderer,
  RenderItem,
  RenderItemFlags,
  RenderItemType,
  RenderScene,
} from '@gglib/render'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready

  const content = new ContentLoader(device)
  const renderer = new Renderer(device)
  const rnd = new MT19937(0x9abcdef0)

  const scene = createScene()
  renderer.addView({
    viewport: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    camera: {
      visibilityMask: LayerMask.All,
      world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.UnitX, 20), Vec3.Zero, Vec3.UnitY),
      view: Mat4.createIdentity(),
      projection: Mat4.createIdentity(),
    },
  })
  renderer.addView({
    viewport: { x: 0.0, y: 0.5, width: 0.5, height: 0.5 },
    camera: {
      visibilityMask: LayerMask.All,
      world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Left, 20), Vec3.Zero, Vec3.UnitY),
      view: Mat4.createIdentity(),
      projection: Mat4.createIdentity(),
    },
  })
  renderer.addView({
    viewport: { x: 0.0, y: 0.0, width: 0.5, height: 0.5 },
    camera: {
      visibilityMask: LayerMask.All,
      world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.UnitZ, 20), Vec3.Zero, Vec3.UnitY),
      view: Mat4.createIdentity(),
      projection: Mat4.createIdentity(),
    },
  })
  renderer.addView({
    viewport: { x: 0.5, y: 0.0, width: 0.5, height: 0.5 },
    camera: {
      visibilityMask: LayerMask.All,
      world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.UnitY, 20), Vec3.Zero, Vec3.NegativeUnitZ),
      view: Mat4.createIdentity(),
      projection: Mat4.createIdentity(),
    },
  })

  const textures = [
    device.createTexture({
      source: '/textures/prototype/red/texture_02.png',
    }),
    device.createTexture({
      source: '/textures/prototype/green/texture_02.png',
    }),
    device.createTexture({
      source: '/textures/prototype/orange/texture_02.png',
    }),
    device.createTexture({
      source: '/textures/prototype/purple/texture_02.png',
    }),
  ]
  for (let i = 0; i < 100; i++) {
    scene.items.push(createObject(device, textures[i % textures.length], rnd))
  }

  function frame(ctx: TaskContext) {
    device.resize()
    for (const view of renderer.getViews()) {
      Mat4.invert(view.camera.world, view.camera.view)
      view.camera.projection.initPerspectiveFieldOfView(
        45 * DEGREE_TO_RAD,
        device.output.aspectRatio,
        0.1,
        100,
        device.ndcMinZ,
      )
    }
    for (const item of scene.items) {
      item.update()
    }

    renderer.update(ctx.time)

    renderer.render(scene)
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

function createObject(device: Device, texture: Texture, rnd: Random): MeshRenderItem & Updatable {
  const material = new CommonMaterial(device)
  const world = Mat4.createTranslation(
    Vec3.create(rnd.nextFloat(), rnd.nextFloat(), rnd.nextFloat()).addScalar(-0.5).multiplyScalar(20),
  )
  const seed = Vec3.create(rnd.nextFloat(), rnd.nextFloat(), rnd.nextFloat())
  material.Texture = texture
  material.TextureEnabled = true
  material.LightingEnabled = true
  material.get('lights.color[0]')!.init(1, 1, 1, 1)
  material.get('lights.direction[0]')!.init(0, 0, -1, 0)

  return {
    type: RenderItemType.Mesh,
    layer: LayerMask.All,
    flags: RenderItemFlags.Opaque,
    transform: world,
    mesh: new Mesh(device, {
      materials: [material],
      parts: [cubeGeometry(device, { materialId: 0 })],
    }),
    update: () => {
      world.rotateYawPitchRoll(seed.x * 0.01, seed.y * 0.01, seed.z * 0.01)
      material.World.initFrom(world)
    },
  }
}

interface Scene extends RenderScene {
  items: Updatable[]
}
interface Updatable extends RenderItem {
  update: () => void
}
function createScene(): Scene {
  const scene: Scene = {
    items: [],
    collect: (camera, out) => {
      for (const item of scene.items) {
        out.push(item)
      }
    },
  }
  return scene
}
