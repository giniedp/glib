import { ContentLoader } from '@gglib/content'
import {
  BasicMaterial,
  BlendState,
  Color,
  CommonInputs,
  createDevice,
  CullState,
  DepthState,
  TaskContext,
} from '@gglib/graphics'
import { MouseInput } from '@gglib/game'
import { GLTF } from '@gglib/loaders'
import { DEGREE_TO_RAD, Mat4, vec3, Vec3 } from '@gglib/math'
import { Model } from '@gglib/model'

export default async (canvas: HTMLCanvasElement) => {
  const device = await createDevice({
    canvas,
    platform: 'auto',
    autosize: true,
  }).ready
  const pass = device.renderPass

  const rt = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })
  const dt = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
    sampleCount: 4,
  })

  const content = new ContentLoader(device)
  content.registerLoader(GLTF.Loader)
  content.registerMaterial({
    match: () => true,
    create: (device, asset) => {
      const material = new BasicMaterial(device, asset)

      material.SkyColor = Color.fromHex('#47caff')
      material.GroundColor = Color.fromHex('#bd34fe')
      material.SkyDirection = Vec3.normalize(vec3(-1, 1, 0))

      return material
    },
  })

  const mouse = new MouseInput({
    //captureTarget: canvas,
    //preventDefault: true,
  })
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

    const offset = Math.sin(time * 0.001 * Math.PI * 0.5) * 0.1
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

  function frame(ctx: TaskContext) {
    device.resize()

    rt.resizeToMatch(device.output)
    dt.resizeToMatch(device.output)

    pass.setRenderTarget(0, rt, 0, 0, device.output)
    pass.setDepthTarget(dt)
    pass.setCullState(CullState.CullBack)
    pass.setDepthState(DepthState.LessEqual)
    pass.setRenderBlend(0, BlendState.Alpha)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()

    if (model) {
      updateScene(ctx.time, ctx.dt)
      renderModel(model)
    }
    pass.submit()
    pass.resolve()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
