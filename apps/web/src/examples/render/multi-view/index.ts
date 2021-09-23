import { ContentManager } from '@gglib/content'
import { LightParams } from '@gglib/fx-materials'
import { CullState, DepthState, Model, createDevice } from '@gglib/graphics'
import { Mat4, Vec3 } from '@gglib/math'
import {
  CommonRenderStep,
  LightSourceData,
  RenderManager,
  RenderStep,
  SceneItemDrawable,
  Scene,
} from '@gglib/render'
import { loop } from '@gglib/utils'

// Create the `Device` and `ContentManager` as usual
const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})
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
  new CommonRenderStep({
    clearColor: 0xffffffff,
    depthState: DepthState.Default,
    cullState: CullState.CullClockWise,
  }),
]

const scene: Scene = {
  views: [
    {
      // on the top left of the viewport
      viewport: { type: 'normalized', x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
      // with camera looking from the right
      camera: {
        world: Mat4.createLookAt(
          Vec3.multiplyScalar(Vec3.Right, 100),
          Vec3.Zero,
          Vec3.Up,
        ),
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
      },
    },
    {
      // on the top right of the viewport
      viewport: { type: 'normalized', x: 0.0, y: 0.5, width: 0.5, height: 0.5 },
      // with camera looking from the left
      camera: {
        world: Mat4.createLookAt(
          Vec3.multiplyScalar(Vec3.Left, 100),
          Vec3.Zero,
          Vec3.Up,
        ),
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
      },
    },
    {
      // on the bottom left of the viewport
      viewport: { type: 'normalized', x: 0.0, y: 0.0, width: 0.5, height: 0.5 },
      // with camera looking from behind
      camera: {
        world: Mat4.createLookAt(
          Vec3.multiplyScalar(Vec3.Backward, 100),
          Vec3.Zero,
          Vec3.Up,
        ),
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
      },
    },
    {
      // on the bottom right of the viewport
      viewport: { type: 'normalized', x: 0.5, y: 0.0, width: 0.5, height: 0.5 },
      // with camera looking at the front
      camera: {
        world: Mat4.createLookAt(
          Vec3.multiplyScalar(Vec3.Up, 100),
          Vec3.Zero,
          Vec3.Forward,
        ),
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
      },
    }
  ],
  items: items,
  lights: lights,
  steps: steps,
}

loop((time, dt) => {
  updateViews(time, dt)
  renderer.update()
  renderer.render([scene])
})

content
  .load('/assets/models/obj/piratekit/ship_dark.obj', Model)
  .then((model) => {
    model.meshes.forEach((mesh) => {
      mesh.parts.forEach((part) => {
        items.push({
          type: 'drawable',
          transform: Mat4.createIdentity(),
          drawable: part,
          material: mesh.getMaterial(part.materialId),
        })
      })
    })
  })

function updateViews(t: number, dt: number) {
  scene.views.forEach((view) => {
    const camera = view.camera
    Mat4.invert(camera.world, camera.view)
    camera.projection.initOrthographic(
      100,
      100 / view.viewport.aspect || 1,
      0.1,
      1000,
    )
  })
}
