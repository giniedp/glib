import { ContentLoader } from '@gglib/content'
import { ParticleChannel } from '@gglib/effects'
import { MouseInput } from '@gglib/game'
import { BlendState, Color, createDevice, CullState, DepthState, FrameContext, PlatformId } from '@gglib/graphics'
import { HDR } from '@gglib/loaders'
import {
  DEGREE_TO_RAD,
  mat4$initLookAt,
  mat4$initPerspectiveFieldOfView,
  mat4$invert,
  mat4Identity,
  vec3,
  vec3$initSpherical,
} from '@gglib/math'
import { mountUi } from 'tweak-ui'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready

  const content = new ContentLoader(device)
  content.registerLoader(HDR.Loader)

  const texture = await content.loadTexture('/textures/particles/star_1.png')
  const msaaColor = device.createRenderTarget({
    format: device.output.format,
    sampleCount: 4,
  })
  const msaaDepth = device.createDepthTarget({
    format: 'depth24plus',
    sampleCount: 4,
  })

  const pass = device.renderPass
  const mouse = new MouseInput()
  const channel = new ParticleChannel(device, {
    minColor: Color.White,
    maxColor: Color.Red,
    minStartSize: 0,
    maxStartSize: 0.5,
    minEndSize: 1.0,
    maxEndSize: 1.5,
    minRotateSpeed: 0,
    maxRotateSpeed: 1,
    gravity: vec3(0, -1, 0),
    texture: texture,
    blendState: BlendState.Alpha,
    minVerticalVelocity: -1,
    maxVerticalVelocity: 1,
    minHorizontalVelocity: -1,
    maxHorizontalVelocity: 1,
  })
  const camera = {
    theta: 0,
    phi: 90,
    fow: 45,
    distance: 2,
    position: vec3(),
    view: mat4Identity(),
    projection: mat4Identity(),
  }

  mountUi(tools, (ui) => {
    ui.group('Settings', { collapsible: true, collapsed: true }, () => {
      ui.color(channel.settings, 'minColor', { format: '{n}xyz' })
      ui.color(channel.settings, 'maxColor', { format: '{n}xyz' })
      ui.scalar(channel.settings, 'minStartSize', { range: true, min: 0, max: 2, step: 0.1 })
      ui.scalar(channel.settings, 'maxStartSize', { range: true, min: 0, max: 5, step: 0.1 })
      ui.scalar(channel.settings, 'minEndSize', { range: true, min: 0, max: 2, step: 0.1 })
      ui.scalar(channel.settings, 'maxEndSize', { range: true, min: 0, max: 5, step: 0.1 })
      ui.scalar(channel.settings, 'minRotateSpeed', { range: true, min: 0, max: 1, step: 0.1 })
      ui.scalar(channel.settings, 'maxRotateSpeed', { range: true, min: 0, max: 1, step: 0.1 })
    })
  })

  function updateCamera() {
    mouse.update()
    if (mouse.leftButtonIsPressed) {
      camera.theta -= mouse.dxNormalized * 360
      camera.phi -= mouse.dyNormalized * 180
    }
    if (mouse.middleButtonIsPressed) {
      camera.distance += mouse.dyNormalized * 2
      camera.distance = Math.max(0.1, camera.distance)
    }

    // prettier-ignore
    vec3$initSpherical(
      camera.position,
      camera.phi * DEGREE_TO_RAD,
      camera.theta * DEGREE_TO_RAD,
      camera.distance * 2,
    )

    mat4$initLookAt(camera.view, camera.position, vec3.Zero, vec3.UnitY)
    mat4$invert(camera.view)
    mat4$initPerspectiveFieldOfView(
      camera.projection,
      camera.fow * DEGREE_TO_RAD,
      device.output.aspectRatio,
      0.01,
      1000,
      device.ndcMinZ,
    )
  }

  const pos = vec3()
  function frame(ctx: FrameContext) {
    updateCamera()

    pos.x = Math.sin(ctx.time * Math.PI * 1) * 2
    pos.y = Math.sin(ctx.time * Math.PI * 2) * 2
    pos.z = Math.cos(ctx.time * Math.PI * 4) * 2
    for (let i = 0; i < 10; i++) {
      channel.emit(pos, vec3(0, 0, 0))
    }
    channel.update(ctx.time, ctx.delta)

    msaaColor.resizeToMatch(device.output)
    msaaDepth.resizeToMatch(device.output)

    pass.setRenderTarget(0, msaaColor, 0, 0, device.output)
    pass.setDepthTarget(msaaDepth)
    pass.setCullState(CullState.None)
    pass.setDepthState(DepthState.Always)
    pass.setRenderBlend(0, BlendState.Alpha)
    pass.setClearColor(0, Color.Black)
    pass.clear()

    if (channel.material.effect.isReady) {
      channel.material.View = camera.view
      channel.material.Projection = camera.projection
      channel.draw()
    }

    pass.submit()
    pass.resolve()
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
