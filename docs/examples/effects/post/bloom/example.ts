import { PostBloomEffect } from '@gglib/effects'
import { BlendState, CullState, DepthState, Device, createDevice, cubeGeometry } from '@gglib/graphics'
import { AutoMaterial } from '@gglib/materials'
import { Mat4, Quat, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

type SceneObject = {
  world: Mat4
  rotation: Quat
  scale: Vec3
  position: Vec3
  color: Vec3
  intensity: number
  seed: number
}

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device: Device = createDevice({
    canvas,
  })

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const material = new AutoMaterial(device)
  const geometry = cubeGeometry(device, {})
  const objects: SceneObject[] = []
  const count = 100
  const bounds = 8
  for (let i = 0; i < count; i++) {
    objects[i] = {
      world: Mat4.createIdentity(),
      rotation: Quat.createIdentity(),
      scale: Vec3.create(1, 1, 1).multiplyScalar(0.5 + Math.random() * 0.5),
      position: Vec3.createRandom()
        .addScalar(-0.5)
        .multiplyScalar(2 * bounds),
      color: Vec3.create(Math.random(), Math.random(), Math.random()),
      seed: Math.random(),
      intensity: 1,
    }
  }

  function updateView() {
    view.initTranslation(0, 0, -bounds)
    projection.initPerspectiveFieldOfView(Math.PI / 3, device.drawingBufferAspectRatio, 1, 100)
  }

  function updateObject(time: number, object: SceneObject) {
    object.intensity = 1 + Math.sin(2 * Math.PI * object.seed + time / 1000) * 0.25
    object.rotation.initYawPitchRoll(
      (object.seed * time) / 2000,
      (object.seed * time) / 4000,
      (object.seed * time) / 8000,
    )
    // prettier-ignore
    object.world
      .initFromQuat(object.rotation)
      .scaleV(object.scale)
      .setTranslationV(object.position)
      .premultiply(world)
  }

  const post = new PostBloomEffect(device, {
    gaussSigma: 1.75,
    glowCut: 0.75,
    iterations: 8,
    multiplier: 0.4,
  })
  device.resize()
  const rt1 = device.createRenderTarget({
    name: 'color',
    pixelFormat: 'RGBA',
    width: device.drawingBufferWidth,
    height: device.drawingBufferHeight,
    depthFormat: 'DepthStencil',
  })
  const rt2 = device.createRenderTarget({
    name: 'intermediate1',
    width: device.drawingBufferWidth,
    height: device.drawingBufferHeight,
  })
  const rt3 = device.createRenderTarget({
    name: 'intermediate2',
    width: device.drawingBufferWidth,
    height: device.drawingBufferHeight,
  })

  function onFrame(time: number) {
    updateView()
    world.initRotationY(time / 40000)
    for (const object of objects) {
      updateObject(time, object)
    }

    if (!material.isReady()) {
      return
    }
    device.resize()
    rt1.image.resize(device.drawingBufferWidth, device.drawingBufferHeight)
    rt2.image.resize(device.drawingBufferWidth, device.drawingBufferHeight)
    rt3.image.resize(device.drawingBufferWidth, device.drawingBufferHeight)

    device.cullState = CullState.Default
    device.depthState = DepthState.Default
    device.blendState = BlendState.Default
    device.setRenderTarget(rt1.image)
    device.clear(0xff2e2620, 1.0)
    for (const object of objects) {
      material.World = object.world
      material.View = view
      material.Projection = projection
      material.DiffuseColor = Vec3.multiplyScalar(object.color, object.intensity)
      material.draw(geometry)
    }
    device.setRenderTarget(null)

    if (post.isReady) {
      post.input = rt1
      post.intermediate1 = rt2
      post.intermediate2 = rt3
      post.draw()
    }
  }

  TweakUi.mount(tools, (ui) => {
    ui.slider(post, 'glowCut', { min: 0, max: 1 })
    ui.slider(post, 'multiplier', { min: 0, max: 1 })
    ui.slider(post, 'gaussSigma', { min: 1, max: 16 })
    ui.slider(post, 'iterations', { min: 1, max: 32, step: 1 })
  })

  return loop(onFrame).stop
}
