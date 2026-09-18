import { ContentLoader } from '@gglib/content'
import {
  DownsampleEffect,
  DownsampleOperator,
  ExtractEffect,
  ExtractOperator,
  TonemapEffect,
  TonemapOperator,
  UpsampleEffect,
  UpsampleOperator,
} from '@gglib/effects'
import { MouseInput } from '@gglib/game'
import {
  BasicMaterial,
  BlendState,
  Color,
  CommonInputs,
  createDevice,
  CullState,
  DepthState,
  FrameContext,
  Texture,
  TextureUsage,
} from '@gglib/graphics'
import { GLTF } from '@gglib/loaders'
import { DEGREE_TO_RAD, Mat4, vec3, Vec3 } from '@gglib/math'
import { Model } from '@gglib/model'

export default async (canvas: HTMLCanvasElement) => {
  const device = await createDevice({
    canvas,
    platform: 'auto',
    autosize: true,
  }).ready

  const msaaScene = device.createRenderTarget({
    format: 'RGBA16_FLOAT',
    sampleCount: 4,
  })
  const msaaDepth = device.createDepthTarget({
    format: 'DEPTH24_PLUS',
    sampleCount: 4,
  })
  const sceneTarget = device.createRenderTarget({
    format: 'RGBA16_FLOAT',
    usage: TextureUsage.TextureBinding,
  })
  const extractTarget = device.createRenderTarget({
    format: 'RGBA16_FLOAT',
    usage: TextureUsage.TextureBinding,
  })
  const downsampleTargets: Texture[] = []
  for (let i = 0; i < 5; i++) {
    downsampleTargets[i] = device.createRenderTarget({
      width: Math.ceil(device.output.width / Math.pow(2, i + 1)),
      height: Math.ceil(device.output.height / Math.pow(2, i + 1)),
      format: 'RGBA16_FLOAT',
      usage: TextureUsage.TextureBinding,
    })
  }

  const fxExtract = await new ExtractEffect(device).compiled
  const fxDownsample = await new DownsampleEffect(device).compiled
  const fxUpsample = await new UpsampleEffect(device).compiled
  const fxTonemap = await new TonemapEffect(device).compiled

  const content = new ContentLoader(device)
  content.registerLoader(GLTF.Loader)
  content.registerMaterial({
    match: () => true,
    create: (device, asset) => {
      const material = new BasicMaterial(device, asset)

      material.AmbientColor = Color.fromHex('#ffd500')
      material.AmbientColorTop = Color.fromHex('#00b86b')
      material.AmbientDirection = Vec3.normalize(vec3(-1, 1, 0))

      return material
    },
  })

  const mouse = new MouseInput({})
  content.loadModel('/logo/gglib.glb').then((value) => {
    model = value
  })

  let model: Model | null = null

  const world = Mat4.createIdentity()
    .rotateX(25 * DEGREE_TO_RAD)
    .rotateY(-45 * DEGREE_TO_RAD)
  const camera = {
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

  let accumX = 0
  let accumY = 0

  function updateScene(time: number, dt: number) {
    mouse.update()

    accumX += (mouse.xNormalized - accumX) * 0.1
    accumY += (mouse.yNormalized - accumY) * 0.1

    const offset = Math.sin(0.75 * Math.PI + time * Math.PI * 0.5) * 0.05
    world
      .initTranslationXYZ(0, offset, 0)
      .rotateX((25 + accumY * 15) * DEGREE_TO_RAD)
      .rotateY((-45 + accumX * 15) * DEGREE_TO_RAD)

    camera.view.initLookAt(vec3(0, 0, 5), vec3(0, 0, 0), Vec3.UnitY).invert()
    camera.projection.initPerspectiveFieldOfView(
      45 * DEGREE_TO_RAD,
      device.output.aspectRatio,
      0.01,
      10,
      device.ndcMinZ,
    )
  }

  function renderModel(model: Model) {
    for (const mesh of model.meshes) {
      for (const material of mesh.materials) {
        material.setInput(CommonInputs.View.ViewMatrix, camera.view)
        material.setInput(CommonInputs.View.ProjectionMatrix, camera.projection)
        material.setInput(CommonInputs.Object.ModelMatrix, world)
      }
    }

    model.draw()
  }

  function frame(ctx: FrameContext) {
    msaaScene.resizeToMatch(device.output)
    msaaDepth.resizeToMatch(device.output)
    sceneTarget.resizeToMatch(device.output)
    extractTarget.resizeToMatch(device.output)

    const pass = device.renderPass
    for (let i = 0; i < downsampleTargets.length; i++) {
      downsampleTargets[i].resize(
        Math.ceil(device.output.width / Math.pow(2, i + 1)),
        Math.ceil(device.output.height / Math.pow(2, i + 1)),
      )

      pass.setClearColor(0, Color.TransparentBlack)
      pass.setRenderTarget(0, downsampleTargets[i])
      pass.setViewportState(0, 0, downsampleTargets[i].width, downsampleTargets[i].height)
      pass.clear()
    }
    pass.flush()

    pass.setClearColor(0, Color.TransparentBlack)
    pass.setRenderTarget(0, sceneTarget)
    pass.clear()
    pass.setRenderTarget(0, extractTarget)
    pass.clear()

    pass.setRenderTarget(0, msaaScene, 0, 0, sceneTarget)
    pass.setViewportState(0, 0, msaaScene.width, msaaScene.height)
    pass.setDepthTarget(msaaDepth)
    pass.clear()
    pass.setCullState(CullState.CullBack)
    pass.setDepthState(DepthState.LessEqual)
    pass.setRenderBlend(0, BlendState.Alpha)
    if (model) {
      updateScene(ctx.time, ctx.delta)
      renderModel(model)
    }
    pass.submit()
    pass.resolve()
    pass.flush()

    pass.setRenderBlend(0, BlendState.Opaque)
    fxExtract.operatorId = ExtractOperator.HIGH_PASS
    fxExtract.knee = 0.25
    fxExtract.range = 0
    fxExtract.threshold = 0.5
    fxExtract.textureIn = sceneTarget
    fxExtract.textureOut = extractTarget
    fxExtract.render(pass)

    pass.setRenderBlend(0, BlendState.Opaque)
    for (let i = 0; i < downsampleTargets.length; i++) {
      fxDownsample.operator = i === 0 ? DownsampleOperator.JIMENEZ_13TAP_KARIS : DownsampleOperator.JIMENEZ_13TAP
      // fxDownsample.operator = DownsampleOperator.KAWASE
      fxDownsample.textureIn = i === 0 ? extractTarget : downsampleTargets[i - 1]
      fxDownsample.textureOut = downsampleTargets[i]
      fxDownsample.render(pass)
    }

    const w = 0.1 * Math.sin(ctx.time * Math.PI)
    pass.setRenderBlend(0, BlendState.Additive)
    for (let i = downsampleTargets.length - 1; i >= 0; i--) {
      fxUpsample.operator = UpsampleOperator.TENT_3X3
      // fxUpsample.operator = UpsampleOperator.KAWASE
      fxUpsample.weight = 0.75 + w
      fxUpsample.textureIn = downsampleTargets[i]
      fxUpsample.textureOut = downsampleTargets[i - 1] || sceneTarget
      fxUpsample.render(pass)
    }

    pass.setRenderBlend(0, BlendState.Opaque)
    fxTonemap.textureIn = sceneTarget
    fxTonemap.textureOut = device.output
    fxTonemap.operator = TonemapOperator.PBR_NEUTRAL
    fxTonemap.whitePoint = 1
    fxTonemap.exposure = 1
    fxTonemap.render(pass)
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
