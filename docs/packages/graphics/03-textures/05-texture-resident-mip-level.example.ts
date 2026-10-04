import { Color, createDevice, Device, PlatformId, SamplerState, SpriteBatch, SpriteMode } from '@gglib/graphics'
import {
  DEGREE_TO_RAD,
  mat4$initLookAt,
  mat4$initPerspectiveFieldOfView,
  mat4$invert,
  mat4Identity,
  mat4Multiply,
  vec3,
} from '@gglib/math'
import { mountUi } from 'tweak-ui'

const settings = {
  residentMipLevel: 0,
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const sprites = new SpriteBatch(device)

  // A 1024x1024 texture has 11 mip levels (1024 ... 1).
  const texture = device.createTexture({
    width: 1024,
    height: 1024,
    generateMipmap: true,
    source: '/textures/formats/uv_checker.png',
  })

  mountUi(tools, (ui) => {
    ui.scalar(settings, 'residentMipLevel', {
      label: 'Resident mip level',
      range: true,
      min: 0,
      max: texture.mipLevelCount - 1,
      step: 1,
    })
  })

  const view = mat4Identity()
  const projection = mat4Identity()
  const viewProjection = mat4Identity()
  // The sprite lies on the XY plane. The camera hovers just above it and looks
  // along it, so the texture is sampled from full detail in front of the camera
  // down to the smallest mip levels towards the horizon.
  const cameraPosition = vec3(0, 20.5, 0.5)
  const cameraTarget = vec3(0, -20, 0)

  const pass = device.renderPass
  function frame() {
    // `residentMipLevel` marks the first mip level that holds data, e.g. while
    // a texture streams in its larger levels. Sampling is clamped to the
    // levels from there on, so the larger (missing) levels are never read.
    //
    // The level is read when the texture is set on a program, so a change
    // has no effect until the texture is set again. The sprite batch sets the
    // texture on every draw, so it picks up the change on its own.
    texture.residentMipLevel = settings.residentMipLevel

    mat4$initLookAt(view, cameraPosition, cameraTarget, vec3.UnitZ)
    mat4$invert(view)
    mat4$initPerspectiveFieldOfView(projection, 60 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)
    mat4Multiply(projection, view, viewProjection)

    // Instead of the default screen space projection, render the sprites
    // with the camera matrix.
    sprites.sampler = SamplerState.LinearWrap
    sprites.begin(SpriteMode.Deferred, viewProjection)
    sprites
      .next(texture)
      // repeat the texture 8 times in each direction
      .source(0, 0, texture.width * 8, texture.height * 8)
      // a 40x40 units plane around the origin
      .destination(-20, -20, 40, 40)

    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()
    pass.render(sprites)

    // The same texture as an overlay in the top left corner. Without a matrix,
    // `begin` falls back to the screen space projection.
    const size = Math.min(device.output.width, device.output.height) / 2
    sprites.sampler = SamplerState.LinearClamp
    sprites.begin()
    sprites.next(texture).destination(10, 10, size, size)
    pass.render(sprites)

    pass.submit()
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
