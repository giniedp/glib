import { AssetType, ContentLoader } from '@gglib/content'
import { CommonMaterial, IblSampler, SkyboxMaterial, skyboxMaterial } from '@gglib/effects'
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
import {
  BoundingSphere,
  DEGREE_TO_RAD,
  mat4$initLookAt,
  mat4$initPerspectiveFieldOfView,
  mat4$invert,
  mat4Identity,
  mat4Premultiply,
  vec3,
  vec3$add,
  vec3$initSpherical,
} from '@gglib/math'
import { Model } from '@gglib/model'
import { mountUi, redrawUi } from 'tweak-ui'

// https://cdn.nw-buddy.de/models/weaponappearances/1hstraightwaterloggedsirens-meshoverride.glb

const PANORAMA_IMAGES = {
  Court: '/textures/hdr/footprint_court.hdr',
  Exterior: '/textures/hdr/cannon_exterior.hdr',
  Overcast: '/textures/hdr/overcast_puresky.hdr',
}
const MODELS = {
  ShaderBall: '/models/gltf/shader-ball.glb',
}
const SETTINGS = {
  baseColor: vec3(1),
  specularColor: vec3(1),
  emissiveColor: vec3(0),
  alpha: 1,
  specularWeight: 1,
  emissiveStrength: 1,
  metallic: 1,
  roughness: 1,
  ior: 1.5,

  iblBlur: 0.5,
  iblIntensity: 1,

  srgb: true,
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({
    canvas,
    platform,
    autosize: true,
  }).ready
  const iblSampler = await new IblSampler(device, {}).compiled

  mountUi(tools, (ui) => {
    ui.color(SETTINGS, 'baseColor', { format: '{n}xyz' })
    ui.scalar(SETTINGS, 'alpha', { range: true, min: 0, max: 1, decimals: 2 })
    ui.color(SETTINGS, 'specularColor', { format: '{n}xyz' })
    ui.scalar(SETTINGS, 'specularWeight', { range: true, min: 0, max: 1, decimals: 2 })
    ui.color(SETTINGS, 'emissiveColor', { format: '{n}xyz' })
    ui.scalar(SETTINGS, 'emissiveStrength', { range: true, min: 0, max: 10, decimals: 2 })

    ui.scalar(SETTINGS, 'metallic', { range: true, min: 0, max: 1, decimals: 2 })
    ui.scalar(SETTINGS, 'roughness', { range: true, min: 0, max: 1, decimals: 2 })
    ui.scalar(SETTINGS, 'ior', { range: true, min: 0, max: 2, decimals: 2 })

    ui.scalar(SETTINGS, 'iblBlur', { range: true, min: 0, max: 1, decimals: 2 })
    ui.scalar(SETTINGS, 'iblIntensity', { range: true, min: 0, max: 10, decimals: 2 })

    ui.bool(SETTINGS, 'srgb')
  })

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
    format: 'depth24plus',
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
  content.registerCreator(AssetType.Material, (ctx, options) => {
    const material = new CommonMaterial(ctx.device, options)
    material.UseIBL = TRUE
    material.IblBrdfMap = iblSampler.lutMapGGX
    material.IblLambertianMap = iblSampler.envMapLambert
    material.IblEnvironmentMap = iblSampler.envMapGGX
    material.IblMipCount = iblSampler.envMapGGX.mipLevelCount
    material.IblIntensity = 1

    return material
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
      skyboxMaterial(device, {
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

  let model: Model | null = null
  let sphere: BoundingSphere

  const world = mat4Identity()
  const camera = {
    theta: 0,
    phi: 90,
    fow: 45,
    distance: 1,
    position: vec3(),
    view: mat4Identity(),
    projection: mat4Identity(),
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
    vec3$initSpherical( camera.position,
      camera.phi * DEGREE_TO_RAD,
      camera.theta * DEGREE_TO_RAD,
      camera.distance * sphere.radius * 2,
    )
    vec3$add(camera.position, sphere.center)

    mat4$initLookAt(camera.view, camera.position, sphere.center, vec3.UnitY)
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

  function updateModel(model: Model) {
    model.update(world)
    const mtl = model.meshes[1].materials[0] as CommonMaterial
    mtl.BaseColor = SETTINGS.baseColor
    mtl.Alpha = SETTINGS.alpha
    mtl.SpecularColor = SETTINGS.specularColor
    mtl.SpecularWeight = SETTINGS.specularWeight
    mtl.EmissiveColor = SETTINGS.emissiveColor
    mtl.EmissiveStrength = SETTINGS.emissiveStrength
    mtl.Metallic = SETTINGS.metallic
    mtl.Roughness = SETTINGS.roughness
    mtl.Ior = SETTINGS.ior
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
        mtl.IblIntensity = SETTINGS.iblIntensity
      }
    }

    model.draw()
  }

  function drawSky() {
    const material = skybox.materials[0] as SkyboxMaterial
    material.ViewProjection = mat4Premultiply(camera.view, camera.projection)
    material.Intensity = SETTINGS.iblIntensity
    material.Blur = SETTINGS.iblBlur
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

    spriteBatch.linearToSrgb = SETTINGS.srgb
    spriteBatch.begin()
    spriteBatch
      .next(color)
      .destination(0, 0, color.width, color.height)
      .flipY(device.isWebGL2 && color.isRenderTarget)
    spriteBatch.draw()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
