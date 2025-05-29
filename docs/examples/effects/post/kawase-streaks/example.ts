import { PostKawaseStreaksEffect } from '@gglib/effects'
import { BlendState, CullState, DepthState, createDevice, cubeGeometry } from '@gglib/graphics'
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
  const device = createDevice({
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

  const post = new PostKawaseStreaksEffect(device, {
    threshold: 0.75,
    iterations: 3,
    attenuation: 0.9,
    strength: 0.75,
  })

  device.resize()
  const rt1 = device.createRenderTarget({
    pixelFormat: 'RGBA',
    width: device.drawingBufferWidth,
    height: device.drawingBufferHeight,
    depthFormat: 'DepthStencil',
  })
  const rt2 = device.createRenderTarget({
    width: Math.floor(device.drawingBufferWidth / 2),
    height: Math.floor(device.drawingBufferHeight / 2),
  })
  const rt3 = device.createRenderTarget({
    width: Math.floor(device.drawingBufferWidth / 2),
    height: Math.floor(device.drawingBufferHeight / 2),
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
    rt1.resize(device.drawingBufferWidth, device.drawingBufferHeight)
    rt2.resize(Math.floor(device.drawingBufferWidth / 2), Math.floor(device.drawingBufferHeight / 2))
    rt3.resize(Math.floor(device.drawingBufferWidth / 2), Math.floor(device.drawingBufferHeight / 2))

    device.cullState = CullState.Default
    device.depthState = DepthState.Default
    device.blendState = BlendState.Default
    if (post.isReady) {
      device.setRenderTarget(rt1.image)
    }
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
      post.inputTexture = rt1
      post.blurTexture1 = rt2
      post.blurTexture2 = rt3
      post.draw()
    }
  }

  TweakUi.mount(tools, (ui) => {
    ui.collapsible('Bloom', (ui) => {
      ui.slider(post, 'threshold', { min: 0, max: 1 })
      ui.slider(post, 'iterations', { min: 1, max: 8, step: 1 })
      ui.slider(post, 'attenuation', { min: 0.5, max: 0.95, step: 0.001 })
      ui.slider(post, 'strength', { min: 0.5, max: 1.0, step: 0.001 })
    })
  })

  return loop(onFrame).stop
}
