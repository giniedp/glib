import { ContentManager } from '@gglib/content'
import '@gglib/loaders'
import { LightParams } from '@gglib/materials'
import { Color, createDevice, CullState, DepthState, Model } from '@gglib/graphics'
import { Mat4, Vec3 } from '@gglib/math'
import { BasicRenderPass, Renderer, Scene } from '@gglib/render'
import { loop } from '@gglib/utils'

export default (canvas: HTMLCanvasElement) => {
  // Create the `Device` and `ContentManager` as usual
  const device = createDevice({
    canvas,
  })
  const content = new ContentManager(device)

  const renderer = new Renderer(device)

  const scene = new Scene()
  scene.views = [
    {
      // on the top left of the viewport
      viewport: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
      // with camera looking from the right
      camera: {
        world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Right, 100), Vec3.Zero, Vec3.Up),
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
      },
    },
    {
      // on the top right of the viewport
      viewport: { x: 0.0, y: 0.5, width: 0.5, height: 0.5 },
      // with camera looking from the left
      camera: {
        world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Left, 100), Vec3.Zero, Vec3.Up),
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
      },
    },
    {
      // on the bottom left of the viewport
      viewport: { x: 0.0, y: 0.0, width: 0.5, height: 0.5 },
      // with camera looking from behind
      camera: {
        world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Backward, 100), Vec3.Zero, Vec3.Up),
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
      },
    },
    {
      // on the bottom right of the viewport
      viewport: { x: 0.5, y: 0.0, width: 0.5, height: 0.5 },
      // with camera looking at the front
      camera: {
        world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Up, 100), Vec3.Zero, Vec3.Forward),
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
      },
    },
  ]
  scene.items = []
  scene.lights = [
    LightParams.createDirectionalLight({
      color: [1, 1, 1],
      direction: [-1, -1, -1],
    }),
  ]
  scene.steps = [
    new BasicRenderPass({
      clearColor: Color.CornflowerBlue.rgba,
      depthState: DepthState.Default,
      cullState: CullState.CullClockWise,
    }),
  ]

  content.load('/assets/models/obj/piratekit/ship_dark.obj', Model).then((model) => {
    model.meshes.forEach((mesh) => {
      mesh.parts.forEach((part) => {
        scene.items.push({
          type: 'drawable',
          transform: Mat4.createIdentity(),
          item: part,
          material: mesh.getMaterial(part.materialId),
        })
      })
    })
  })

  function updateViews(t: number, dt: number) {
    scene.views.forEach((view) => {
      const camera = view.camera!
      Mat4.invert(camera.world, camera.view)
      const aspect = device.drawingBufferAspectRatio
      camera.projection.initOrthographic(100, 100 / aspect || 1, 0.1, 1000)
    })
  }

  return loop((time, dt) => {
    updateViews(time, dt)
    renderer.render([scene])
  }).stop
}
