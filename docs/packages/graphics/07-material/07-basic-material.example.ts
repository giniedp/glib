import {
  BasicMaterial,
  BlendState,
  Color,
  createDevice,
  DepthState,
  Device,
  FALSE,
  FrameContext,
  PlatformId,
  torusGeometry,
  TRUE,
} from '@gglib/graphics'
import {
  DEGREE_TO_RAD,
  mat4$initIdentity,
  mat4$initPerspectiveFieldOfView,
  mat4$initTranslation,
  mat4$invert,
  mat4$rotateX,
  mat4$rotateY,
  mat4$rotateZ,
  mat4Identity,
  vec3,
} from '@gglib/math'
import { mountUi } from 'tweak-ui'

const params = {
  ambientColorTop: vec3(1),
  ambientColor: vec3(0.25),
  ambientDirection: vec3(0, 0, 1),
  baseColor: vec3(1),
  alpha: 1,
  textured: true,
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  mountUi(tools, (ui) => {
    ui.group('Material', { collapsed: true, collapsible: true }, () => {
      ui.color(params, 'baseColor', { format: '{n}xyz' })
      ui.color(params, 'ambientColorTop', { format: '{n}xyz' })
      ui.color(params, 'ambientColor', { format: '{n}xyz' })
      ui.spherical(params, 'ambientDirection')
      ui.scalar(params, 'alpha', { range: true, min: 0, max: 1, decimals: 2 })
      ui.bool(params, 'textured')
    })
  })

  const geometry = torusGeometry(device)
  const material = new BasicMaterial(device, { properties: {} })
  const texture = device.createTexture({ source: '/textures/formats/uv_checker.png' })

  const world = mat4Identity()
  const view = mat4Identity()
  const projection = mat4Identity()
  const cameraPosition = vec3(0, 0, 3)

  const rtColor = device.createRenderTarget({
    format: device.output.format,
    width: device.output.width,
    height: device.output.height,
    sampleCount: 4,
  })
  const rtDetph = device.createDepthTarget({
    format: 'depth24plus',
    width: device.output.width,
    height: device.output.height,
    sampleCount: 4,
  })

  const pass = device.renderPass
  function frame(ctx: FrameContext) {
    rtColor.resizeToMatch(device.output)
    rtDetph.resizeToMatch(device.output)
    pass.flush()

    if (!material.effect.isReady) {
      return
    }

    const t = ctx.time

    mat4$initIdentity(world)
    mat4$rotateX(world, t * 25 * DEGREE_TO_RAD)
    mat4$rotateY(world, t * 15 * DEGREE_TO_RAD)
    mat4$rotateZ(world, t * 10 * DEGREE_TO_RAD)
    mat4$initTranslation(view, cameraPosition)
    mat4$invert(view)
    mat4$initPerspectiveFieldOfView(projection, 60 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    material.World = world
    material.View = view
    material.Projection = projection

    material.AmbientColor = params.ambientColor
    material.AmbientColorTop = params.ambientColorTop
    material.AmbientDirection = params.ambientDirection
    material.BaseColor = params.baseColor
    material.Alpha = params.alpha
    material.UseBlend = params.alpha < 1 ? TRUE : FALSE
    material.BaseMap = texture
    material.UseBaseMap = params.textured ? TRUE : FALSE

    material.effect.applyInputs(material.inputBlocks)

    pass.setRenderTarget(0, rtColor, 0, 0, device.output)
    pass.setDepthTarget(rtDetph)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.setDepthState(DepthState.LessEqual)
    pass.setRenderBlend(0, material.UseBlend ? BlendState.Alpha : BlendState.Opaque)

    pass.clear()

    material.effect.draw(device.renderPass, geometry)

    pass.resolve()
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
