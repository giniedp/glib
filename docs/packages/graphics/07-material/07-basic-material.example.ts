import {
  BasicMaterial,
  BlendState,
  Color,
  createDevice,
  DepthState,
  Device,
  FALSE,
  PlatformId,
  TaskContext,
  torusGeometry,
  TRUE,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, vec3, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const params = {
  skyColor: vec3(1),
  groundColor: vec3(0.25),
  skyDirection: vec3(0, 0, 1),
  baseColor: vec3(1),
  alpha: 1,
  textured: true,
}

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  mountUi(tools, (ui) => {
    ui.color(params, 'baseColor', { format: '{n}xyz' })
    ui.color(params, 'skyColor', { format: '{n}xyz' })
    ui.color(params, 'groundColor', { format: '{n}xyz' })
    ui.spherical(params, 'skyDirection')
    ui.scalar(params, 'alpha', { range: true, min: 0, max: 1, decimals: 2 })
    ui.bool(params, 'textured')
  })

  const geometry = torusGeometry(device)
  const material = new BasicMaterial(device)
  const texture = device.createTexture({ source: '/textures/prototype/proto_red.png' })

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const cameraPosition = Vec3.create(0, 0, 3)

  const rtColor = device.createRenderTarget({
    format: device.output.format,
    width: device.output.width,
    height: device.output.height,
    sampleCount: 4,
  })
  const rtDetph = device.createDepthTarget({
    format: 'DEPTH24_PLUS_STENCIL8',
    width: device.output.width,
    height: device.output.height,
    sampleCount: 4,
  })

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    rtColor.resizeToMatch(device.output)
    rtDetph.resizeToMatch(device.output)
    pass.flush()

    if (!material.effect.isReady) {
      return
    }

    const t = ctx.time / 1000

    world
      .initIdentity()
      .rotateX(t * 25 * DEGREE_TO_RAD)
      .rotateY(t * 15 * DEGREE_TO_RAD)
      .rotateZ(t * 10 * DEGREE_TO_RAD)
    view.initTranslation(cameraPosition).invert()
    projection.initPerspectiveFieldOfView(60 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    material.World = world
    material.View = view
    material.Projection = projection

    material.SkyColor = params.skyColor
    material.GroundColor = params.groundColor
    material.SkyDirection = params.skyDirection
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

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
