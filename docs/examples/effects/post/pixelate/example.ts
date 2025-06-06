import { PostPixelateEffect } from '@gglib/effects'
import { BlendState, CullState, DepthState, createDevice, cubeGeometry } from '@gglib/graphics'
import { AutoMaterial } from '@gglib/materials'
import { Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

type SceneObject = {
  world: Mat4
  color: Vec3
}

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({
    canvas,
  })

  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const material = new AutoMaterial(device)
  const postEffect = new PostPixelateEffect(device, {
    pixelHeight: 5,
    pixelWidth: 5,
  })
  const geometry = cubeGeometry(device, {})
  const renderTarget = device.createRenderTarget({
    width: device.drawingBufferWidth,
    height: device.drawingBufferHeight,
    depthFormat: 'DepthStencil',
  })
  const objects: SceneObject[][] = []
  const size = 5
  for (let y = 0; y < size; y++) {
    objects[y] = objects[y] || []
    for (let x = 0; x < size; x++) {
      objects[y][x] = {
        world: Mat4.createIdentity(),
        color: Vec3.create(Math.random(), Math.random(), Math.random()),
      }
    }
  }

  function onFrame(time: number) {
    device.resize()
    renderTarget.resize(device.drawingBufferWidth, device.drawingBufferHeight)

    updateView()
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        updateObject(time, objects[y][x], x, y)
      }
    }

    device.cullState = CullState.Default
    device.depthState = DepthState.Default
    device.blendState = BlendState.Default
    device.setRenderTarget(renderTarget.image)
    device.clear(0xff2e2620, 1.0)
    for (const row of objects) {
      for (const object of row) {
        material.World = object.world
        material.View = view
        material.Projection = projection
        material.DiffuseColor = object.color
        material.draw(geometry)
      }
    }
    device.setRenderTarget(null)

    postEffect.inputTexture = renderTarget
    postEffect.draw()
  }

  function updateView() {
    view.initTranslationXYZ(0, 0, -2)
    projection.initPerspectiveFieldOfView(Math.PI / 3, device.drawingBufferAspectRatio, 1, 10)
  }

  function updateObject(time: number, object: SceneObject, x: number, y: number) {
    object.world
      .initIdentity()
      .rotateYawPitchRoll(time / 2000, time / 4000, time / 8000)
      .setTranslationXYZ(x - (size - 1) / 2, size - y - (size + 1) / 2, -2)
  }

  TweakUi.mount(tools, (ui) => {
    ui.slider(postEffect, 'pixelWidth', { min: 1, max: 100, step: 1 })
    ui.slider(postEffect, 'pixelHeight', { min: 1, max: 100, step: 1 })
    ui.slider({ size: 1 }, 'size', {
      min: 1,
      max: 100,
      step: 1,
      onInput: (_, v: any) => {
        postEffect.pixelWidth = v
        postEffect.pixelHeight = v
      },
    })
  })

  return loop(onFrame).stop
}
