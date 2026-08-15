import { ContentLoader } from '@gglib/content'
import { CommonMaterial, createDevice, PlatformId, TaskContext } from '@gglib/graphics'
import '@gglib/loaders'
import { MTL, OBJ } from '@gglib/loaders'
import { Mat4, Vec3 } from '@gglib/math'
import {
  BloomPass,
  CameraData,
  LayerMask,
  ModelRenderItem,
  PixelatePass,
  Renderer,
  RenderItem,
  RenderItemFlags,
  RenderItemType,
  RenderScene,
} from '@gglib/render'
import { mountUi } from 'tweak-ui'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready
  const content = new ContentLoader(device)
  content.registerLoader(OBJ.Loader)
  content.registerLoader(MTL.Loader)
  content.registerMaterial(CommonMaterial, () => true)

  const renderer = new Renderer(device)
  renderer.pipeline.addPass(new PixelatePass(device, { enabled: false }))
  renderer.pipeline.addPass(new BloomPass(device, { enabled: false }))

  type GameObject = ModelRenderItem & {
    tag: 'tree' | 'ship' | 'static'
  }

  const objects: GameObject[] = []
  const scene: RenderScene = {
    collect: (camera: CameraData, out: RenderItem[]) => {
      for (const object of objects) {
        if (object.model) {
          out.push(object)
        }
      }
    },
  }

  const view = renderer.addView({
    camera: {
      visibilityMask: LayerMask.All,
      world: Mat4.createLookAt({ x: 0, y: 25, z: 75 }, Vec3.Zero, Vec3.UnitY),
      view: Mat4.createIdentity(),
      projection: Mat4.createIdentity(),
      reversedZ: false,
    },
  })

  function updateObjects(time: number, dt: number) {
    for (const object of objects) {
      updateObject(object, time, dt)
    }
  }

  function updateObject(object: GameObject, time: number, dt: number) {
    if (object.tag === 'ship') {
      object.transform
        .initIdentity()
        .rotateY(time / 8000)
        .translateXYZ(-100, 0.5 * Math.sin(time / 200) - 3, 0)
    }
    updateMaterial(object)
  }

  function updateCamera(time: number, dt: number) {
    const camera = view.camera
    const ship = objects.find((it) => it.tag === 'ship')

    if (ship) {
      camera.world.initLookAt(camera.world.getTranslation(), ship.transform.getTranslation(), Vec3.UnitY)
    }
    Mat4.invert(camera.world, camera.view)
    camera.projection.initPerspectiveFieldOfView(Math.PI / 2.4, device.output.aspectRatio, 0.1, 1500, device.ndcMinZ)
  }

  function updateMaterial(object: GameObject) {
    for (const mesh of object.model.meshes) {
      for (const material of mesh.materials) {
        const mtl = material as CommonMaterial
        mtl.TextureEnabled = true
        mtl.LightingEnabled = true
        mtl.World.initFrom(object.transform)
        mtl.get('lights.color[0]')!.init(1, 1, 1, 1)
        mtl.get('lights.direction[0]')!.init(0, 0, -1, 0)
      }
    }
  }

  // ### Step 3 - Load models and create game objects
  //
  // ---

  // Load the tower model and create a game object
  // content.loadModel('/models/obj/tower-complete-large.obj').then((model) => {
  //   const object: GameObject = {
  //     type: RenderItemType.Model,
  //     model: model,
  //     tag: 'static',
  //     transform: Mat4.createIdentity(),
  //     flags: RenderItemFlags.Opaque,
  //     layer: LayerMask.All,
  //     prepare: (ctx) => updateMaterial(object, ctx),
  //   }
  //   objects.push(object)
  // })

  // Load the island model and create a game object
  // content.loadModel('/models/obj/piratekit/hole.obj').then((model) => {
  //   const world = Mat4.createScaleXYZ(8, 8, 8)
  //   gameObjects.push({
  //     type: RenderItemType.Model,
  //     model: model,
  //     tag: 'static',
  //     transform: world,
  //     flags: RenderItemFlags.Opaque,
  //     layer: LayerMask.All,
  //   })
  // })

  // Load the ship model and create a game object
  content.loadModel('/models/obj/ship-pirate-large.obj').then((model) => {
    const object: GameObject = {
      type: RenderItemType.Model,
      model: model,
      tag: 'ship',
      transform: Mat4.createIdentity(),
      flags: RenderItemFlags.Opaque,
      layer: LayerMask.All,
    }
    objects.push(object)
  })

  // Load the ship model and create a game object
  // content.loadModel('/models/obj/piratekit/pirate_officer.obj').then((model) => {
  //   const world = Mat4.createRotationY(Math.PI).translateXYZ(20, 10, 20)
  //   gameObjects.push({
  //     type: RenderItemType.Model,
  //     model: model,
  //     tag: 'static',
  //     transform: world,
  //     flags: RenderItemFlags.Opaque,
  //     layer: LayerMask.All,
  //   })
  // })

  // Generate the water surface
  // function loadWater() {
  //   const mtl = new CommonMaterial(device)
  //   mtl.BaseColor.initFromArray([0.5, 0.77, 0.87])
  //   //mtl.FogColor = [1, 1, 1]
  //   mtl.FogStart = 100
  //   mtl.FogEnd = 500
  //   mtl.FogEnabled = 1

  //   const model = GeometryBuilder.begin()
  //     .append(buildPlane, { size: 1000, tesselation: 4 })
  //     .calculateTangents()
  //     .closeMesh({
  //       materials: [mtl],
  //     })
  //     .endMesh(device)

  //   const world = Mat4.createIdentity()
  //   gameObjects.push({
  //     type: RenderItemType.Model,
  //     tag: 'static',
  //     model: model!,
  //     transform: world,
  //     flags: RenderItemFlags.Opaque,
  //     layer: LayerMask.All,
  //   })
  // }
  // loadWater()

  // Generate the background
  // function loadSky() {
  //   const mtl = new CommonMaterial(device)
  //   mtl.BaseColor.initFromArray([1, 1, 1])
  //   const mesh = GeometryBuilder.begin()
  //     .append((b) => {
  //       buildSphere(b, { radius: 1000, tesselation: 32 })
  //       flipWindingOrder(b.indices as number[])
  //     })
  //     .closeMesh({
  //       materials: [mtl],
  //     })
  //     .endMesh(device)

  //   debugger
  //   const model = new Model(device, {
  //     meshes: [mesh],
  //   })

  //   const world = Mat4.createIdentity()
  //   gameObjects.push({
  //     type: RenderItemType.Model,
  //     tag: 'static',
  //     model: model!,
  //     transform: world,
  //     flags: RenderItemFlags.Opaque,
  //     layer: LayerMask.All,
  //   })
  // }
  // loadSky()

  mountUi(tools, (ui) => {
    renderer.pipeline.passes.forEach((it) => {
      if (it instanceof BloomPass) {
        ui.group('Bloom', { collapsible: true }, (c) => {
          c.bool(it, 'enabled')
          c.scalar(it, 'glowCut', { range: true, min: 0, max: 1, step: 0.001 })
          c.scalar(it, 'multiplier', { range: true, min: 0, max: 1, step: 0.01 })
          c.scalar(it, 'gaussSigma', { range: true, min: 0, max: 1, step: 0.01 })
          c.scalar(it, 'iterations', { range: true, min: 0, max: 10, step: 1 })
        })
      }
      if (it instanceof PixelatePass) {
        ui.group('Pixelate', { collapsible: true }, (c) => {
          c.bool(it, 'enabled')
          c.scalar(it, 'size', { range: true, min: 1, max: 50, step: 1 })
          c.scalar(it, 'corner', { range: true, min: 0, max: 1, step: 0.001 })
        })
      }
    })
  })

  function frame(ctx: TaskContext) {
    updateObjects(ctx.time, ctx.dt)
    updateCamera(ctx.time, ctx.dt)
    renderer.render(scene)
  }
  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
