import * as TweakUi from 'tweak-ui'

import { ContentManager } from '@gglib/content'
import { Device, Model } from '@gglib/graphics'
import { Mat4, Vec3, Vec4 } from '@gglib/math'
import { BasicStage, Manager as RenderManager } from '@gglib/render'
import { loop } from '@gglib/utils'

let device = new Device({ canvas: document.getElementById('canvas') as HTMLCanvasElement })
let content = new ContentManager(device)
let renderer = new RenderManager(device)

let items = [] as any[]
let lights = [{
  color: new Vec4(1, 1, 1, 1),
  position: new Vec4(0, 0, 1000, 0),
  direction: new Vec4(0, 0, -1, 1),
  misc: new Vec4(1000, 0, 0, 1),
}]
let steps = [
  new BasicStage({
    clearColor: 0xFFFFFFFF,
  }),
]

renderer.addScene({
  id: 0,
  viewport: { type: 'normalized', x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
  camera: {
    world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Right, 200), Vec3.Zero, Vec3.Up),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  },
  items: items,
  lights: lights,
  steps: steps,
})
renderer.addScene({
  id: 1,
  viewport: { type: 'normalized', x: 0.0, y: 0.5, width: 0.5, height: 0.5 },
  camera: {
    world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Left, 200), Vec3.Zero, Vec3.Up),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  },
  items: items,
  lights: lights,
  steps: steps,
})
renderer.addScene({
  id: 2,
  viewport: { type: 'normalized', x: 0.0, y: 0.0, width: 0.5, height: 0.5 },
  camera: {
    world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Backward, 200), Vec3.Zero, Vec3.Up),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  },
  items: items,
  lights: lights,
  steps: steps,
})
renderer.addScene({
  id: 3,
  viewport: { type: 'normalized', x: 0.5, y: 0.0, width: 0.5, height: 0.5 },
  camera: {
    world: Mat4.createLookAt(Vec3.multiplyScalar(Vec3.Up, 200), Vec3.Zero, Vec3.Forward),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  },
  items: items,
  lights: lights,
  steps: steps,
})

let objects = []

let time = 0
loop((dt) => {
  time += dt
  updateViews(time, dt)
  updateLights(time, dt)
  renderer.update()
  renderer.render()
})

content.load('/assets/models/obj/ghoul/ghoul.obj', Model).then((model) => {
  objects.push(createObject(model))
})

function createObject(model: Model) {
  let object = {
    world: Mat4.createIdentity(),
    model: model,
  }

  model.meshes.forEach((mesh) => {
    items.push({
      world: object.world,
      drawable: mesh,
      material: (model.materials[mesh.materialId] || model.materials[0]),
    })
  })

  return object
}

function updateViews(time: number, dt: number) {
  renderer.scenes.forEach((scene) => {
    const aspect = renderer.resolveBounds(scene, null).aspect
    const camera = scene.camera
    Mat4.invert(camera.world, camera.view)
    camera.projection.initPerspectiveFieldOfView(Math.PI / 2.4, aspect, 0.1, 1000)
  })
}

function updateLights(time: number, dt: number) {
  let light = lights[0]
  light.direction.x = Math.sin(2 * Math.PI * time / 10000)
  light.direction.z = Math.cos(2 * Math.PI * time / 10000)
}
