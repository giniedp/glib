import { ContentManager } from '@gglib/content'
import '@gglib/loaders'
import { AutoMaterial, LightParams } from '@gglib/materials'
import {
  buildPlane,
  buildSphere,
  createDevice,
  CullState,
  DepthState,
  flipWindingOrder,
  GeometryBuilder,
  Model,
} from '@gglib/graphics'
import { Mat4, Vec3 } from '@gglib/math'
import {
  BasicRenderPass,
  DrawableInfo,
  PostPixelateStep,
  PostStepBloom,
  Renderer,
  Scene,
} from '@gglib/render'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  // ### Setup the render manager
  //
  // ---

  // Create the `Device` and `ContentManager` as usual
  const device = createDevice({
    canvas,
  })
  const content = new ContentManager(device)

  // Create an instance of the `RenderManager`.
  // The render manager is responsible for managing render targets
  // and rendering scenes.
  const renderer = new Renderer(device)

  const scene = new Scene()
  scene.items = [] // will be filled later
  scene.lights = [
    LightParams.createDirectionalLight({
      direction: [-1, -1, -1],
      color: [1, 1, 1],
    })
  ]
  scene.camera = {
    world: Mat4.createLookAt({ x: 0, y: 25, z: 75 }, Vec3.Zero, Vec3.Up),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }
  scene.steps = [
    new BasicRenderPass({
      depthState: DepthState.Default,
      cullState: CullState.CullClockWise,
    }),
    new PostStepBloom(device, {}),
    new PostPixelateStep(device, {}),
  ]

  // ### Define the game logic
  //
  // ---

  // All game objects will be held in this list.
  // The definition of a game object is pretty basic
  // basic but its enough for this example.
  const gameObjects: GameObject[] = []
  interface GameObject {
    type: 'tree' | 'ship' | 'static'
    world: Mat4
    model: Model
    renderItems: DrawableInfo[]
  }

  // This function simply iterates over all known game objects
  // and calls the update logic.
  // Each frame we re-fill the `scene.items` array.
  // That seems to be for no reason, but we actually could
  // perform culling here.
  function updateObjects(time: number, dt: number) {
    scene.items.length = 0
    for (const object of gameObjects) {
      updateObject(object, time, dt)
      for (const item of object.renderItems) {
        scene.items.push(item)
      }
    }
  }

  // Here we update the ship movement. Around it goes.
  function updateObject(object: GameObject, time: number, dt: number) {
    if (object.type === 'ship') {
      object.world
        .initIdentity()
        .rotateY(time / 8000)
        .translate(100, 0.5 * Math.sin(time / 200) - 3, 0)
    }
  }

  // The camera keeps its position but always looks at the ship
  function updateCamera(time: number, dt: number) {
    const camera = scene.camera!
    const ship = gameObjects.find((it) => it.type === 'ship')
    if (ship) {
      camera.world!.initLookAt(camera.world!.getTranslation(), ship.world.getTranslation(), Vec3.Up)
    }
    Mat4.invert(camera.world!, camera.view)
    camera.projection.initPerspectiveFieldOfView(Math.PI / 2.4, device.drawingBufferAspectRatio, 0.1, 1500)
  }

  // ### Step 3 - Load models and create game objects
  //
  // ---

  // Load the tower model and create a game object
  content.load('/models/obj/piratekit/tower.obj', Model).then((model) => {
    const world = Mat4.createRotationY(Math.PI)
    gameObjects.push({
      type: 'static',
      model: model,
      world: world,
      renderItems: makeDrawableList(model, world),
    })
  })

  // Load the island model and create a game object
  content.load('/models/obj/piratekit/hole.obj', Model).then((model) => {
    const world = Mat4.createScale(8, 8, 8)
    gameObjects.push({
      type: 'static',
      model: model,
      world: world,
      renderItems: makeDrawableList(model, world),
    })
  })

  // Load the ship model and create a game object
  content.load('/models/obj/piratekit/ship_light.obj', Model).then((model) => {
    const world = Mat4.createIdentity()
    gameObjects.push({
      type: 'ship',
      model: model,
      world: world,
      renderItems: makeDrawableList(model, world),
    })
  })

  // Load the ship model and create a game object
  content.load('/models/obj/piratekit/pirate_officer.obj', Model).then((model) => {
    const world = Mat4.createRotationY(Math.PI).translate(20, 10, 20)
    gameObjects.push({
      type: 'static',
      model: model,
      world: world,
      renderItems: makeDrawableList(model, world),
    })
  })

  // Generate the water surface
  function loadWater() {
    const mtl = new AutoMaterial(device)
    mtl.BaseColor = [0.5, 0.77, 0.87]
    mtl.FogColor = [1, 1, 1]
    mtl.FogStart = 100
    mtl.FogEnd = 500
    mtl.FogType = 3
    mtl.ShadeFunction = 'shadeLambert'

    const model = GeometryBuilder.begin()
      .append(buildPlane, { size: 1000, tesselation: 4 })
      .calculateTangents(true)
      .closeMesh({
        materials: [mtl],
      })
      .endModel(device)

    const world = Mat4.createIdentity()
    gameObjects.push({
      type: 'static',
      model: model!,
      world: world,
      renderItems: makeDrawableList(model!, world),
    })
  }
  loadWater()

  // Generate the background
  function loadSky() {
    const mtl = new AutoMaterial(device)
    mtl.BaseColor = [1, 1, 1]
    mtl.ShadeFunction = 'shadeNone'

    const model = GeometryBuilder.begin()
      .append((b) => {
        buildSphere(b, { radius: 1000, tesselation: 32 })
        flipWindingOrder(b.indices as number[])
      })
      .closeMesh({
        materials: [mtl],
      })
      .endModel(device)

    const world = Mat4.createIdentity()
    gameObjects.push({
      type: 'static',
      model: model!,
      world: world,
      renderItems: makeDrawableList(model!, world),
    })
  }
  loadSky()

  function makeDrawableList(model: Model, world: Mat4): DrawableInfo[] {
    const result: DrawableInfo[] = []
    model.meshes.map((mesh) => {
      mesh.parts.forEach((part) => {
        result.push({
          type: 'drawable',
          transform: world,
          item: part,
          material: mesh.getMaterial(part.materialId),
        })
      })
    })
    return result
  }

  TweakUi.mount(tools, (q: TweakUi.Builder) => {
    scene.steps!.forEach((it) => {
      if (it instanceof PostStepBloom) {
        q.collapsible('Bloom', (c) => {
          c.checkbox(it, 'enabled')
          c.slider(it, 'glowCut', { min: 0, max: 1, step: 0.001 })
          c.slider(it, 'multiplier', { min: 0, max: 1, step: 0.01 })
          c.slider(it, 'gaussSigma', { min: 0, max: 1, step: 0.01 })
          c.slider(it, 'iterations', { min: 0, max: 10, step: 1 })
        })
      }
      if (it instanceof PostPixelateStep) {
        q.collapsible('Pixelate', (c) => {
          c.checkbox(it, 'enabled')
          c.slider(it, 'pixelWidth', { min: 1, max: 32, step: 1 })
          c.slider(it, 'pixelHeight', { min: 1, max: 32, step: 1 })
        })
      }
    })
  })

  return loop((time, dt) => {
    updateObjects(time, dt)
    updateCamera(time, dt)
    renderer.render([scene])
  }).stop
}
