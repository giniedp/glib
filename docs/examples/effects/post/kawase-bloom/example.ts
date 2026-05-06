import { PostKawaseBloomEffect } from '@gglib/effects'
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
    view.initTranslationXYZ(0, 0, -bounds)
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
      .scale(object.scale)
      .setTranslation(object.position)
      .premultiply(world)
  }

  const post = new PostKawaseBloomEffect(device, {
    glowCut: 0.5,
    iterations: 5,
  })
  device.resize()
  post.inputTexture = device.createRenderTarget({
    pixelFormat: 'RGBA',
    width: device.drawingBufferWidth,
    height: device.drawingBufferHeight,
    depthFormat: 'DepthStencil',
  })
  post.blurTexture1 = device.createRenderTarget({
    width: device.drawingBufferWidth,
    height: device.drawingBufferHeight,
  })
  post.blurTexture2 = device.createRenderTarget({
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
    post.inputTexture.resize(device.drawingBufferWidth, device.drawingBufferHeight)
    post.blurTexture1.resize(device.drawingBufferWidth, device.drawingBufferHeight)
    post.blurTexture2.resize(device.drawingBufferWidth, device.drawingBufferHeight)

    device.cullState = CullState.Disabled
    device.depthState = DepthState.Disabled
    device.blendState = BlendState.Disabled
    if (post.isReady) {
      device.setRenderTarget(post.inputTexture.image)
    }
    device.clear(0xff2e2620, 1.0)
    for (const object of objects) {
      material.World = object.world
      material.View = view
      material.Projection = projection
      material.BaseColor = Vec3.multiplyScalar(object.color, object.intensity)
      material.draw(geometry)
    }
    device.setRenderTarget(null)

    if (post.isReady) {
      post.draw()
    }
  }

  TweakUi.mount(tools, (ui) => {
    ui.collapsible('Bloom', (ui) => {
      ui.slider(post, 'glowCut', { min: 0, max: 1 })
      ui.slider(post, 'iterations', { min: 1, max: 20, step: 1 })
    })
  })

  return loop(onFrame).stop
}
