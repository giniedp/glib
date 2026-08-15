import { ContentLoader } from '@gglib/content'
import { CommonMaterial, IblSampler, SkyboxMaterial } from '@gglib/effects'
import { MouseInput } from '@gglib/game'
import {
  BlendState,
  Color,
  CullState,
  DepthState,
  Mesh,
  PlatformId,
  SpriteBatch,
  TRUE,
  TextureUsage,
  boxGeometry,
  createDevice,
} from '@gglib/graphics'
import { GLTF, HDR, KTX } from '@gglib/loaders'
import { BoundingSphere, DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { Model } from '@gglib/model'
import { mountUi, redrawUi } from 'tweak-ui'

// https://cdn.nw-buddy.de/models/weaponappearances/1hstraightwaterloggedsirens-meshoverride.glb

const PANORAMA_IMAGES = {
  Court: '/textures/hdr/footprint_court.hdr',
  Exterior: '/textures/hdr/cannon_exterior.hdr',
  Overcast: '/textures/hdr/overcast_puresky.hdr',
  Sky: '/textures/Grey_Sky.png',
}
const MODELS = {
  ShaderBall: '/models/gltf/USDShaderBallForGltf.glb',
}
export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({
    canvas,
    platform,
    autosize: true,
  }).ready
  const iblSampler = await new IblSampler(device, {}).ready

  const pass = device.renderPass
  const msaaColor = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })
  const msaaDepth = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
    sampleCount: 4,
  })
  const color = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 1,
    usage: TextureUsage.TextureBinding,
  })
  const spriteBatch = new SpriteBatch(device)

  GLTF.Loader.registerExtension(GLTF.KhrMaterialsSpecular)
  GLTF.Loader.registerExtension(GLTF.KhrMaterialsEmissiveStrength)
  GLTF.Loader.registerExtension(GLTF.KhrMaterialsPbrSpecularGlossinessHandler)
  GLTF.Loader.registerExtension(GLTF.KhrMaterialsIor)
  const content = new ContentLoader(device)
  content.registerLoader(GLTF.Loader)
  content.registerLoader(KTX.Loader)
  content.registerLoader(HDR.Loader)
  content.registerMaterial({
    match: () => true,
    create: (device, options) => {
      const material = new CommonMaterial(device, options)
      material.UseIBL = TRUE
      material.IblBrdfMap = iblSampler.lutMapGGX
      material.IblLambertianMap = iblSampler.envMapLambert
      material.IblEnvironmentMap = iblSampler.envMapGGX
      material.IblMipCount = iblSampler.envMapGGX.mipLevelCount
      material.IblIntensity = 1

      return material
    },
  })

  const mouse = new MouseInput()

  const skybox = new Mesh(device, {
    partImports: [
      {
        geometry: boxGeometry(device, { invert: true }),
        materialIndex: 0,
      },
    ],
    materials: [
      new SkyboxMaterial(device, {
        blur: 0.5,
        cubemap: iblSampler.envMapGGX,
        intensity: 1,
      }),
    ],
  })

  async function loadEnvFile(url: string) {
    content.loadTexture(url).then((texture) => {
      iblSampler.update(texture)
    })
  }

  loadEnvFile(PANORAMA_IMAGES.Court)
  loadModel(MODELS.ShaderBall)
  mountUi(tools, (ui) => {
    ui.select({ model: MODELS.ShaderBall }, 'model', {
      options: MODELS,
      onchange: (it, value) => loadModel(value as string),
    })
  })

  let model: Model | null = null
  let sphere: BoundingSphere

  const world = Mat4.createIdentity()
  const camera = {
    theta: 0,
    phi: 90,
    fow: 45,
    distance: 2,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

  function loadModel(url: string) {
    content
      .loadModel(url)
      .then((result) => {
        model?.dispose()
        model = result
        model.update(world)
        sphere = model.boundingSphere.copy()
        console.log(sphere)
        redrawUi()
      })
      .catch((e) => {
        model = null!
        console.error(e)
      })
  }

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
    camera.position.initSpherical(
      camera.phi * DEGREE_TO_RAD,
      camera.theta * DEGREE_TO_RAD,
      camera.distance * sphere.radius * 2,
    ).add(sphere.center)

    camera.view.initLookAt(camera.position, sphere.center, Vec3.UnitY).invert()
    camera.projection.initPerspectiveFieldOfView(
      camera.fow * DEGREE_TO_RAD,
      device.output.aspectRatio,
      0.01,
      1000,
      device.ndcMinZ,
    )
  }

  function updateModel(model: Model) {
    model.update(world)
  }

  function drawModel(model: Model) {
    for (const node of model.sceneNodes) {
      const mesh = model.meshes[node.data?.mesh!]
      if (!mesh) {
        continue
      }

      for (const material of mesh.materials) {
        const mtl = material as CommonMaterial
        mtl.World = node.world
        mtl.View = camera.view
        mtl.Projection = camera.projection
        mtl.CameraPosition = camera.position
      }
    }

    model.draw()
  }

  function drawSky() {
    const material = skybox.materials[0] as SkyboxMaterial
    material.ViewProjection = Mat4.premultiply(camera.view, camera.projection)
    skybox.draw()
  }

  function frame() {
    msaaColor.resizeToMatch(device.output)
    msaaDepth.resizeToMatch(device.output)
    color.resizeToMatch(device.output)

    pass.setRenderTarget(0, msaaColor, 0, 0, color)
    pass.setDepthTarget(msaaDepth)
    pass.setCullState(CullState.CullBack)
    pass.setDepthState(DepthState.LessEqual)
    pass.setRenderBlend(0, BlendState.Alpha)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()

    if (model) {
      updateCamera()
      drawSky()
      updateModel(model)
      drawModel(model)
    }
    pass.submit()
    pass.resolve()
    pass.flush()

    spriteBatch.linearToSrgb = true
    spriteBatch.begin()
    spriteBatch
      .next(color)
      .destination(0, 0, color.width, color.height)
      .flipY(device.isWebGL2 && color.isRenderTarget)
    spriteBatch.draw()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
