import { PostBloomEffect } from '@gglib/effects'
import { BlendState, CullState, DepthState, createDevice, cubeGeometry } from '@gglib/graphics'
import { AutoMaterial } from '@gglib/materials'
import { Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

type SceneObject = {
  world: Mat4
  color: Vec3
  intensity: number
  seed: number
}

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({
    canvas,
  })

  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const material = new AutoMaterial(device)
  const geometry = cubeGeometry(device, {})
  const objects: SceneObject[][] = []
  const size = 5
  for (let y = 0; y < size; y++) {
    objects[y] = objects[y] || []
    for (let x = 0; x < size; x++) {
      objects[y][x] = {
        world: Mat4.createIdentity(),
        color: Vec3.create(Math.random(), Math.random(), Math.random()),
        seed: Math.random(),
        intensity: 1,
      }
    }
  }

  const postEffect = new PostBloomEffect(device, {
    gaussSigma: 1.75,
    glowCut: 0.75,
    iterations: 8,
    multiplier: 0.4,
  })
  const rt1 = device.createRenderTarget({
    pixelFormat: 'RGBA',
    width: device.drawingBufferWidth,
    height: device.drawingBufferHeight,
    depthFormat: 'DepthStencil',
  })
  const rt2 = device.createRenderTarget({ width: device.drawingBufferWidth, height: device.drawingBufferHeight })
  const rt3 = device.createRenderTarget({ width: device.drawingBufferWidth, height: device.drawingBufferHeight })

  function updateView() {
    view.initTranslation(0, 0, -2)
    projection.initPerspectiveFieldOfView(Math.PI / 3, device.drawingBufferAspectRatio, 1, 10)
  }

  function updateObject(time: number, object: SceneObject, x: number, y: number) {
    object.world
      .initIdentity()
      .rotateYawPitchRoll(time / 2000, time / 4000, time / 8000)
      .setTranslation(x - (size - 1) / 2, size - y - (size + 1) / 2, -2)
    object.intensity = 1 + Math.sin(2 * Math.PI * object.seed + time / 1000) * 0.25
  }

  function onFrame(time: number) {
    device.resize()
    rt1.resize(device.drawingBufferWidth, device.drawingBufferHeight)
    rt2.resize(device.drawingBufferWidth, device.drawingBufferHeight)
    rt3.resize(device.drawingBufferWidth, device.drawingBufferHeight)

    updateView()
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        updateObject(time, objects[y][x], x, y)
      }
    }

    device.cullState = CullState.Default
    device.depthState = DepthState.Default
    device.blendState = BlendState.Default
    device.setRenderTarget(rt1)
    device.clear(0xff2e2620, 1.0)
    for (const row of objects) {
      for (const object of row) {
        material.World = object.world
        material.View = view
        material.Projection = projection
        material.DiffuseColor = Vec3.multiplyScalar(object.color, object.intensity)
        material.draw(geometry)
      }
    }
    device.setRenderTarget(null)

    postEffect.input = rt1
    postEffect.intermediate1 = rt2
    postEffect.intermediate2 = rt3
    postEffect.draw()
  }

  TweakUi.mount(tools, (ui) => {
    ui.slider(postEffect, 'glowCut', { min: 0, max: 1 })
    ui.slider(postEffect, 'multiplier', { min: 0, max: 1 })
    ui.slider(postEffect, 'gaussSigma', { min: 1, max: 16 })
    ui.slider(postEffect, 'iterations', { min: 1, max: 32, step: 1 })
  })

  return loop(onFrame).stop
}
