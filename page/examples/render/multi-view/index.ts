import { ContentManager } from '@gglib/content'
import { LightParams } from '@gglib/effects'
import { CullState, DepthState, Device, Model } from '@gglib/graphics'
import { Mat4, Vec3 } from '@gglib/math'
import { BasicRenderStep, LightSourceData, RenderManager, RenderStep, SceneItemDrawable } from '@gglib/render'
import { loop } from '@gglib/utils'

// Create the `Device` and `ContentManager` as usual
const device = new Device({ canvas: document.getElementById('canvas') as HTMLCanvasElement })
const content = new ContentManager(device)

// Create an instance of the `RenderManager`.
const renderer = new RenderManager(device)

// All scenes will be referencing the same
// data and rendering arrays.
const items: SceneItemDrawable[] = [] as any[]
const lights: LightSourceData[] = [
  LightParams.createDirectionalLight({
    color: [1, 1, 1],
    direction: [-1, -1, -1],
  }),
]

const steps: RenderStep[] = [
  new BasicRenderStep({
    clearColor: 0xffffffff,
    depthState: DepthState.Default,
    cullState: CullState.CullClockWise,
  }),
]

// The first scene
renderer.addScene({
  id: 0,
  // on the top left of the viewport
  viewport: { type: 'normalized', x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
  // with camera looking from the right
  camera: {
    world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Right, 100), Vec3.Zero, Vec3.Up),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  },
  items: items,
  lights: lights,
  steps: steps,
})

// The second scene
renderer.addScene({
  id: 1,
  // on the top right of the viewport
  viewport: { type: 'normalized', x: 0.0, y: 0.5, width: 0.5, height: 0.5 },
  // with camera looking from the left
  camera: {
    world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Left, 100), Vec3.Zero, Vec3.Up),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  },
  items: items,
  lights: lights,
  steps: steps,
})
// The third scene
renderer.addScene({
  id: 2,
  // on the bottom left of the viewport
  viewport: { type: 'normalized', x: 0.0, y: 0.0, width: 0.5, height: 0.5 },
  // with camera looking from behind
  camera: {
    world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Backward, 100), Vec3.Zero, Vec3.Up),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  },
  items: items,
  lights: lights,
  steps: steps,
})

// The last scene
renderer.addScene({
  id: 3,
  // on the bottom right of the viewport
  viewport: { type: 'normalized', x: 0.5, y: 0.0, width: 0.5, height: 0.5 },
  // with camera looking at the front
  camera: {
    world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Up, 100), Vec3.Zero, Vec3.Forward),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  },
  items: items,
  lights: lights,
  steps: steps,
})

loop((time, dt) => {
  updateViews(time, dt)
  renderer.update()
  renderer.render()
})

content.load('/assets/models/obj/piratekit/ship_dark.obj', Model).then(model => {
  model.meshes.forEach(mesh => {
    items.push({
      type: 'drawable',
      transform: Mat4.createIdentity(),
      drawable: mesh,
      material: model.getMaterial(mesh.materialId),
    })
  })
})

function updateViews(t: number, dt: number) {
  renderer.eachScene(scene => {
    const camera = scene.camera
    Mat4.invert(camera.world, camera.view)
    camera.projection.initOrthographic(100, 100 / scene.viewport.aspect || 1, 0.1, 1000)
  })
}
