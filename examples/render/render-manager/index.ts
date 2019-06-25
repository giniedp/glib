import * as TweakUi from 'tweak-ui'

import { ContentManager } from '@gglib/content'
import { Device, Model } from '@gglib/graphics'
import { Mat4, Vec3, Vec4 } from '@gglib/math'
import { BasicStage, Manager as RenderManager, PostBloom, PostBloomKawase, PostPixelate, PostTonemap } from '@gglib/render'
import { loop } from '@gglib/utils'

// Create the device as usual
let device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const renderer = new RenderManager(device)
const content = new ContentManager(device)
const scene = {
  id: 0,
  camera: {
    world: Mat4.createIdentity(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  },
  lights: [{
    color: new Vec4(1, 1, 1, 1),
    position: new Vec4(0, 0, 1000, 0),
    direction: new Vec4(0, 0, -1, 1),
    misc: new Vec4(1000, 0, 0, 1),
  }],
  items: [] as any[],
  steps: [
    new BasicStage(),
    new PostBloom(device, { enabled: true }),
    new PostBloomKawase(device, { enabled: false }),
    new PostPixelate(device, { enabled: false }),
    new PostTonemap(device, { enabled: false }),
  ],
}

// add the scene to the renderer
renderer.addScene(scene)

const worldSize = 500
const gameObjects = []
let gameTime = 0

loop((dt: number) => {
  gameTime += dt
  updateCamera(gameTime, dt)
  updateLight(gameTime, dt)
  updateObjects(gameTime, dt)

  if (gameObjects.length) {
    renderer.update()
    renderer.render()
  }

})

content.load('/assets/models/obj/ghoul/ghoul.obj', Model).then((model) => {
  for (let i = 0; i < 10; i++) {
    gameObjects.push(createObject(model))
  }
})

function createObject(model: Model) {
  const position = Vec3.createRandom().normalize().multiplyScalar(worldSize)
  const direction = Vec3.createRandom().normalize()
  const up = new Vec3(0, 1, 0)

  const object = {
    position: position,
    direction: direction,
    up: up,
    world: Mat4.createWorld(position, direction, up),
    model: model,
    renderItems: [],
  }

  model.meshes.forEach(function(mesh) {
    object.renderItems.push({
      world: object.world,
      drawable: mesh,
      material: (model.materials[mesh.materialId] || model.materials[0]),
    })
  })

  return object
}

function updateCamera(time: number, dt: number) {
  const camera = scene.camera
  camera.world.initTranslation(0, 0, worldSize * 1.5)
  Mat4.invert(camera.world, camera.view)
  camera.projection.initPerspectiveFieldOfView(Math.PI / 2.4, device.drawingBufferAspectRatio, 0.1, worldSize * 3)
}

function updateLight(time: number, dt: number) {
  // scene.lights[0].position.x = Math.cos(2*Math.PI*time / 10000) * 50
  // scene.lights[0].position.y = 0
  // scene.lights[0].position.z = Math.sin(2*Math.PI*time / 10000) * 50
}

function updateObjects(time: number, dt: number) {
  scene.items.length = 0
  gameObjects.forEach((object) => {
    updateObject(object, time, dt)
    // we could perform culling here
    scene.items.push(...object.renderItems)
  })
}

function updateObject(object, time, dt) {
  Vec3.multiplyScalarAdd(object.direction, dt / 10, object.position, object.position)
  if (Math.abs(object.position.x) > worldSize) {
    object.direction.x = -object.direction.x
  }
  if (Math.abs(object.position.y) > worldSize) {
    object.direction.y = -object.direction.y
  }
  if (Math.abs(object.position.z) > worldSize) {
    object.direction.z = -object.direction.z
  }
  Vec3.clampScalar(object.position, -(worldSize - 0.1), worldSize - 0.1, object.position)

  object.forward = object.world.getForward(object.forward)
  object.forward.x += (-object.direction.x - object.forward.x) * dt * 0.01
  object.forward.y += (-object.direction.y - object.forward.y) * dt * 0.01
  object.forward.z += (-object.direction.z - object.forward.z) * dt * 0.01

  object.world.initWorld(object.position, object.forward, object.up)
}

TweakUi.build('#tweak-ui' , (q: TweakUi.Builder) => {
  scene.steps.forEach((it) => {
    if (it instanceof PostBloom) {
      q.group('Bloom', {}, (c) => {
        c.checkbox(it, 'enabled')
        c.slider(it, 'glowCut', { min: 0, max: 1, step: 0.001 })
        c.slider(it, 'multiplier', { min: 0, max: 1, step: 0.01 })
        c.slider(it, 'gaussSigma', { min: 0, max: 1, step: 0.01 })
      })
    }
    if (it instanceof PostBloomKawase) {
      q.group('Bloom Kawase', {}, (c) => {
        c.checkbox(it, 'enabled')
        c.slider(it, 'glowCut', { min: 0, max: 1, step: 0.001 })
        c.slider(it, 'iterations', { min: 2, max: 25, step: 1 })
        c.checkbox(it, 'halfSize')
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
    if (it instanceof PostTonemap) {
      q.group('Tonemapping', {}, (c) => {
        c.checkbox(it, 'enabled')
        c.slider(it, 'adaptSpeed', { min: 0, max: 1, step: 0.001 })
        c.slider(it, 'exposure', { min: 0, max: 1, step: 0.001 })
        c.slider(it, 'blackPoint', { min: 0, max: 1, step: 0.001 })
        c.slider(it, 'whitePoint', { min: 0, max: 1, step: 0.001 })
        c.slider(it, 'debugTarget', { min: 0, max: 6, step: 1 })
        c.button('Clear', {
          onClick: () => it.clearNext = true,
        })
      })
    }
  })
})
