import * as TweakUi from 'tweak-ui'

import { ContentManager } from '@gglib/content'
import { AutoMaterial, LightParams } from '@gglib/effects'
import { buildPlane, buildSphere, Device, flipWindingOrder, Model, ModelBuilder } from '@gglib/graphics'
import { Mat4, Vec3 } from '@gglib/math'
import { BasicRenderStep, DrawableData, PostBloom, PostPixelate, RenderManager } from '@gglib/render'
import { loop } from '@gglib/utils'

// ### Setup the render manager
//
// ---

// Create the `Device` and `ContentManager` as usual
const device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})
const content = new ContentManager(device)

// Create an instance of the `RenderManager`.
// The render manager is responsible for managing render targets
// and rendering scenes.
const renderer = new RenderManager(device)
// A scene is what we need next. Create one.
const scene = renderer.addScene({
  // We could have more than one scene. To identify them we must provide an id.
  id: 0,
  // The scene will be populated with renderable items.
  // For now it is an empty array. We will fill that later.
  items: [],
  // The camera is simply a set of matrices. Mainly the view and projection.
  // For this demo this will be our camera object.
  // A camera might be attached and detached at any time. If a scene has no
  // camera, it wont get rendered.
  camera: {
    world: Mat4.createLookAt({ x: 0, y: 25, z: 75 }, Vec3.Zero, Vec3.Up),
    view: Mat4.createIdentity(),
    projection: Mat4.createPerspectiveFieldOfView(Math.PI / 2.4, device.drawingBufferAspectRatio, 0.1, 1500),
  },
  // Our scene has only one light. But it could have more.
  // These can be used by a rendering step to feed the shader with lighting parameters.
  lights: [
    LightParams.createDirectionalLight({
      direction: [-1, -1, -1],
      color: [1, 1, 1],
    }),
  ],
  // Now the `RenderManager` can not render by itself. It just manages resources
  // and scenes. The actual rendering is implemented in so called `Stage`'s or
  // rendering steps.
  // Here we add a basic rendering stage and 2 post processing stages.
  steps: [
    new BasicRenderStep(),
    new PostBloom(device, { enabled: true }),
    new PostPixelate(device, { enabled: false }),
  ],
})

// ### Define the game logic
//
// ---

// All game objects will be held in this list.
// The definition of a game object is pretty basic
// basic but its enough for this example.
const gameObjects: GameObject[] = []
interface GameObject {
  type: 'tree' | 'ship' | 'static',
  world: Mat4,
  model: Model,
  renderItems: DrawableData[],
}

// The tiny render loop
loop((time, dt) => {
  updateObjects(time, dt)
  updateCamera(time, dt)
  renderer.update()
  renderer.render()
})

// This function simply iterates over all known game objects
// and calls the update logic.
// Each frame we re-fill the `scene.items` array.
// That seems to be for no reason, but we actually could
// perform culling here.
function updateObjects(time: number, dt: number) {
  scene.items.length = 0
  gameObjects.forEach((object) => {
    updateObject(object, time, dt)
    scene.items.push(...object.renderItems)
  })
}

// Here we update the ship movement. Around it goes.
function updateObject(object: GameObject, time: number, dt: number) {
  if (object.type === 'ship') {
    object.world
      .initIdentity()
      .translate(100, 0.5 * Math.sin(time / 200) - 3, 0)
      .rotateY(time / 8000)
  }
}

// The camera keeps its position but always looks at the ship
function updateCamera(time: number, dt: number) {
  const camera = scene.camera
  const ship = gameObjects.find((it) => it.type === 'ship')
  if (ship) {
    camera.world.initLookAt(
      camera.world.getTranslation(),
      ship.world.getTranslation(),
      Vec3.Up,
    )
  }
  Mat4.invert(camera.world, camera.view)
}

// ### Step 3 - Load models and create game objects
//
// ---

// Load the tower model and create a game object
content.load('/assets/models/obj/piratekit/tower.obj', Model).then((model) => {
  const world = Mat4.createRotationY(Math.PI)
  gameObjects.push({
    type: 'static',
    model: model,
    world: world,
    renderItems: makeDrawableList(model, world),
  })
})

// Load the island model and create a game object
content.load('/assets/models/obj/piratekit/hole.obj', Model).then((model) => {
  const world = Mat4.createScale(8, 8, 8)
  gameObjects.push({
    type: 'static',
    model: model,
    world: world,
    renderItems: makeDrawableList(model, world),
  })
})

// Load the ship model and create a game object
content.load('/assets/models/obj/piratekit/ship_light.obj', Model).then((model) => {
  const world = Mat4.createIdentity()
  gameObjects.push({
    type: 'ship',
    model: model,
    world: world,
    renderItems: makeDrawableList(model, world),
  })
})

// Load the ship model and create a game object
content.load('/assets/models/obj/piratekit/pirate_officer.obj', Model).then((model) => {
  const world = Mat4
    .createRotationY(Math.PI)
    .translate(20, 10, 20)
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
  mtl.DiffuseColor = [0.5, 0.77, 0.87]
  mtl.FogColor = [1, 1, 1]
  mtl.FogStart = 100
  mtl.FogEnd = 500
  mtl.FogType = 3
  mtl.ShadeFunction = 'shadeLambert'

  const model = ModelBuilder.begin().tap((b) => {
    buildPlane(b, { size: 1000, tesselation: 4 })
    b.calculateTangents(true)
  }).endModel(device, {
    materials: [mtl],
  })

  const world = Mat4.createIdentity()
  gameObjects.push({
    type: 'static',
    model: model,
    world: world,
    renderItems: makeDrawableList(model, world),
  })
}
loadWater()

// Generate the background
function loadSky() {
  const mtl = new AutoMaterial(device)
  mtl.DiffuseColor = [1, 1, 1]
  mtl.ShadeFunction = 'shadeNone'

  const model = ModelBuilder.begin().tap((b) => {
    buildSphere(b, { radius: 1000, tesselation: 32 })
    flipWindingOrder(b.indices)
  }).endModel(device, {
    materials: [mtl],
  })

  const world = Mat4.createIdentity()
  gameObjects.push({
    type: 'static',
    model: model,
    world: world,
    renderItems: makeDrawableList(model, world),
  })
}
loadSky()

function makeDrawableList(model: Model, world: Mat4): DrawableData[] {
  return model.meshes.map((mesh) => {
    return {
      transform: world,
      drawable: mesh,
      material: model.getMaterial(mesh.materialId),
    }
  })
}

TweakUi.build('#tweak-ui' , (q: TweakUi.Builder) => {
  scene.steps.forEach((it) => {
    if (it instanceof PostBloom) {
      q.group('Bloom', {}, (c) => {
        c.checkbox(it, 'enabled')
        c.slider(it, 'glowCut', { min: 0, max: 1, step: 0.001 })
        c.slider(it, 'multiplier', { min: 0, max: 1, step: 0.01 })
        c.slider(it, 'gaussSigma', { min: 0, max: 1, step: 0.01 })
        c.slider(it, 'iterations', { min: 0, max: 10, step: 1 })
      })
    }
    if (it instanceof PostPixelate) {
      q.group('Pixelate', {}, (c) => {
        c.checkbox(it, 'enabled')
        c.slider(it, 'pixelWidth', { min: 1, max: 32, step: 1 })
        c.slider(it, 'pixelHeight', { min: 1, max: 32, step: 1 })
        c.slider(it, 'offset', { min: 0, max: 1, step: 0.001 })
      })
    }
  })
})
