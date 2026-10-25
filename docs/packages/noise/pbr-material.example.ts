// #region imports
import { AssetType, ContentLoader } from '@gglib/content'
import { CommonMaterial, IblSampler, type SkyboxMaterial, skyboxMaterial } from '@gglib/effects'
import {
  BlendState,
  boxGeometry,
  Color,
  createDevice,
  CullState,
  DepthState,
  type Device,
  FALSE,
  type Geometry,
  Mesh,
  planeGeometry,
  type PlatformId,
  SamplerState,
  sphereGeometry,
  type SurfaceFormat,
  SpriteBatch,
  TextureUsage,
  torusGeometry,
  TRUE,
} from '@gglib/graphics'
import { GLTF, HDR } from '@gglib/loaders'
import {
  DEGREE_TO_RAD,
  mat4$initLookAt,
  mat4$initPerspectiveFieldOfView,
  mat4$initScaleXYZ,
  mat4$invert,
  mat4Identity,
  mat4Premultiply,
  vec3,
  vec3$init,
  vec3Copy,
} from '@gglib/math'
import type { Model } from '@gglib/model'
import {
  abs,
  add,
  color,
  fbm,
  type Field,
  gradient,
  mix,
  mul,
  normals,
  type Operator,
  perlin,
  pow,
  ProceduralTexture,
  remap,
  rgba,
  scale,
  seamless,
  simplex,
  smoothstep,
  sub,
  tiles,
  uniform,
  type Uniform,
  warp,
} from '@gglib/noise'
import { mount } from 'tweak-ui'
// #endregion

// texels per side of each map
const SIZE = 512
// the maps bake the region [0, 0, PERIOD, PERIOD], seamless repeats the fields with this period
const PERIOD = 4

/**
 * The fields of a PBR material, one texture per field
 */
interface MaterialMaps {
  // linear color, baked into an sRGB texture
  base: Field<any>
  // glTF packing: occlusion in r, roughness in g, metallic in b
  orm: Field<any>
  // tangent space normals
  normal: Field<any>
  // linear color, baked into an sRGB texture
  emissive: Field<any>
}

// gradient colors are sRGB, the material works in linear space
const toLinear = () => pow(2.2)

/**
 * Molten lava with a cooled crust: a continuous texture, everything is derived from one seamless fbm
 */
function lava(tileable: () => Operator<any, any>): MaterialMaps {
  // fbm with its zero crossings as glowing cracks. Seamless is applied to the raw noise (mean 0),
  // the nonlinear steps after it keep their contrast
  const noise = perlin().pipe(
    fbm({ octaves: 6, gain: uniform('roughness', 0.5, { min: 0.3, max: 0.7 }) }),
    warp(simplex().pipe(scale(0.5)), uniform('flow', 0.6, { min: 0, max: 2 })),
    tileable(),
  )
  // 0 in the molten cracks, 1 on the crust
  const crust = noise.pipe(abs(), smoothstep(0, uniform('cracks', 0.12, { min: 0.02, max: 0.4 })))
  // small bumps on the crust
  const detail = perlin().pipe(scale(4), fbm({ octaves: 4 }), tileable(), remap(-0.7, 0.7, 0.6, 1))
  const height = crust.pipe(mul(detail))
  const molten = crust.pipe(remap(0, 1, 1, 0), pow(uniform('falloff', 2, { min: 0.5, max: 6 })))

  return {
    base: height.pipe(
      gradient([
        [0, '#2a0800'],
        [0.4, '#1a1412'],
        [1, '#3d3633'],
      ]),
      toLinear(),
    ),
    orm: rgba(height.pipe(remap(0, 1, 0.4, 1)), crust.pipe(remap(0, 1, 0.35, 0.95)), 0, 1),
    normal: height.pipe(normals({ strength: uniform('bump', 0.15, { min: 0, max: 1 }) })),
    emissive: molten.pipe(
      gradient([
        [0, '#000000'],
        [0.3, '#7a1000'],
        [0.7, '#ff5000'],
        [1, '#ffd070'],
      ]),
      toLinear(),
    ),
  }
}

/**
 * Polished marble tiles in a checker pattern: a pattern texture. The tiles repeat with the period by
 * themselves, only the veins need seamless
 */
function marbleTiles(tileable: () => Operator<any, any>): MaterialMaps {
  const grout = uniform('grout', 0.03, { min: 0, max: 0.15 })
  const edge = tiles({ output: 'edge' })
  // 0 in the grout, 1 on the tiles. The bevel rounds the tile edges in the height
  const tileMask = edge.pipe(sub(grout), smoothstep(0, 0.005))
  const height = edge.pipe(sub(grout), smoothstep(0, uniform('bevel', 0.04, { min: 0.005, max: 0.2 })))
  const checker = tiles({ output: 'checker' })

  // veins along the zero crossings of a stretched fbm. A random offset per tile moves the veins, so neighbouring
  // tiles differ. It only changes at tile borders, which are also the borders of the texture
  const veins = perlin().pipe(
    scale([1, 2.5, 1]),
    fbm({ octaves: 6 }),
    warp(perlin().pipe(scale(0.5)), uniform('marbling', 0.8, { min: 0, max: 2 })),
    tileable(),
    add(tiles({ output: 'random' }).pipe(remap(0, 1, -0.3, 0.3))),
    abs(),
    smoothstep(0, uniform('veins', 0.08, { min: 0.01, max: 0.3 })),
  )
  const white = veins.pipe(
    gradient([
      [0, '#7d7468'],
      [0.6, '#d9d4cb'],
      [1, '#f2efe9'],
    ]),
  )
  const black = veins.pipe(
    gradient([
      [0, '#cbbd99'],
      [0.5, '#2a2826'],
      [1, '#121212'],
    ]),
  )
  const groutMask = tileMask.pipe(remap(0, 1, 1, 0))

  return {
    base: white.pipe(mix(black, checker), mix(color('#77716a'), groutMask), toLinear()),
    // polished tiles with slightly rougher veins, rough grout
    orm: rgba(
      height.pipe(remap(0, 1, 0.5, 1)),
      veins.pipe(remap(0, 1, 0.3, 0.08), mix(0.9, groutMask)),
      0,
      1,
    ),
    normal: height.pipe(normals({ strength: uniform('bump', 0.03, { min: 0, max: 0.2 }) })),
    emissive: color('#000000'),
  }
}

const PRESETS: Record<string, (tileable: () => Operator<any, any>) => MaterialMaps> = {
  lava,
  'marble tiles': marbleTiles,
}

const MAP_FORMATS: Record<keyof MaterialMaps, SurfaceFormat> = {
  base: 'rgba8unorm-srgb',
  orm: 'rgba8unorm',
  normal: 'rgba8unorm',
  emissive: 'rgba8unorm-srgb',
}
const MAP_NAMES = Object.keys(MAP_FORMATS) as Array<keyof MaterialMaps>

interface Shape {
  create: (device: Device) => Geometry
  // texture repeats per axis at repeat 1, keeps the texels square
  uv: [number, number]
}

const SHAPES: Record<string, Shape> = {
  sphere: { create: (device) => sphereGeometry(device, { radius: 1, stacks: 64, slices: 64 }), uv: [2, 1] },
  plane: { create: (device) => planeGeometry(device, { size: 3 }), uv: [1, 1] },
  torus: { create: (device) => torusGeometry(device, { radius: 1, tubeRadius: 0.4, radialSegments: 96 }), uv: [3, 1] },
}
const SHADER_BALL = 'shader ball'
// index of the outer shell in the meshes of the shader ball
const SHADER_BALL_SHELL = 1

const settings = {
  preset: 'lava',
  shape: SHADER_BALL,
  seamless: true,
  repeat: 2,
  emissive: 4,
  animate: false,
  speed: 0.1,
  autoRotate: true,
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready
  const iblSampler = await new IblSampler(device, {}).compiled

  const content = new ContentLoader(device)
  content.registerLoader(HDR.Loader)
  content.loadTexture('/textures/hdr/footprint_court.hdr').then((texture) => iblSampler.update(texture))

  // one procedural texture per map, the fields are replaced when the preset changes
  let maps = buildMaps()
  const textures = {} as Record<keyof MaterialMaps, ProceduralTexture>
  for (const name of MAP_NAMES) {
    textures[name] = new ProceduralTexture(device, maps[name], {
      width: SIZE,
      height: SIZE,
      format: MAP_FORMATS[name],
      region: [0, 0, PERIOD, PERIOD],
      // the maps are repeated over the mesh, mipmaps avoid aliasing
      mipmaps: true,
    })
  }
  let dirty = true

  function buildMaps(): MaterialMaps {
    const tileable = () => (settings.seamless ? seamless(PERIOD, { mean: 0 }) : (source: Field<any>) => source)
    return PRESETS[settings.preset](tileable)
  }

  function rebuild() {
    maps = buildMaps()
    for (const name of MAP_NAMES) {
      // compiles a new shader per map
      textures[name].field = maps[name]
    }
    dirty = true
    remountPanel()
  }

  function useIbl(material: CommonMaterial) {
    material.UseIBL = TRUE
    material.IblBrdfMap = iblSampler.lutMapGGX
    material.IblLambertianMap = iblSampler.envMapLambert!
    material.IblEnvironmentMap = iblSampler.envMapGGX
    material.IblMipCount = iblSampler.envMapGGX.mipLevelCount
    material.IblIntensity = 1
  }

  // binds the baked maps, the factors are 1 so the maps alone define the surface
  function useMaps(material: CommonMaterial) {
    material.BaseColor = vec3(1)
    material.Metallic = 1
    material.Roughness = 1
    material.EmissiveColor = vec3(1)
    material.UseVertexColor = FALSE
    material.BaseMap = textures.base.texture
    material.BaseMapSampler = SamplerState.LinearWrap
    material.UseBaseMap = TRUE
    material.NormalMap = textures.normal.texture
    material.NormalMapSampler = SamplerState.LinearWrap
    material.UseNormalMap = TRUE
    material.MetallicRoughnessMap = textures.orm.texture
    material.MetallicRoughnessMapSampler = SamplerState.LinearWrap
    material.UseMetallicRoughnessMap = TRUE
    material.OcclusionMap = textures.orm.texture
    material.OcclusionMapSampler = SamplerState.LinearWrap
    material.UseOcclusionMap = TRUE
    material.EmissiveMap = textures.emissive.texture
    material.EmissiveMapSampler = SamplerState.LinearWrap
    material.UseEmissiveMap = TRUE
    material.UseTextureMod = TRUE
  }

  // material of the primitive shapes
  const material = new CommonMaterial(device, {})
  useIbl(material)
  useMaps(material)
  const meshes: Record<string, Mesh> = {}
  for (const [name, shape] of Object.entries(SHAPES)) {
    meshes[name] = new Mesh(device, {
      partImports: [{ geometry: shape.create(device), materialIndex: 0 }],
      materials: [material],
    })
  }

  // the shader ball: the outer shell gets the baked maps, stand and core keep their materials
  content.registerLoader(GLTF.Loader)
  content.registerCreator(AssetType.Material, (ctx, options) => {
    const result = new CommonMaterial(ctx.device, options)
    useIbl(result)
    return result
  })
  let shaderBall: Model | null = null
  content.loadModel('/models/gltf/shader-ball.glb').then((model) => {
    model.update(mat4Identity())
    useMaps(model.meshes[SHADER_BALL_SHELL].materials[0] as CommonMaterial)
    shaderBall = model
  })

  const skybox = new Mesh(device, {
    partImports: [{ geometry: boxGeometry(device, { invert: true }), materialIndex: 0 }],
    materials: [skyboxMaterial(device, { blur: 0.6, cubemap: iblSampler.envMapGGX, intensity: 1 })],
  })

  // the uniforms of all maps by name. The maps of a preset share their uniform instances,
  // setting a value on one map's params is enough, but a map may not use every uniform
  function uniformList(): Uniform[] {
    const result = new Map<string, Uniform>()
    for (const name of MAP_NAMES) {
      for (const it of maps[name].uniformList) {
        result.set(it.name, it)
      }
    }
    return Array.from(result.values())
  }
  const params: Record<string, number> = {}
  function bindParams() {
    for (const key of Object.keys(params)) {
      delete params[key]
    }
    for (const it of uniformList()) {
      Object.defineProperty(params, it.name, {
        enumerable: true,
        configurable: true,
        get: () => it.value,
        set: (value: number) => {
          for (const name of MAP_NAMES) {
            if (it.name in maps[name].params) {
              maps[name].params[it.name] = value
            }
          }
        },
      })
    }
  }

  let panel = mountPanel()
  function remountPanel() {
    panel.dispose()
    panel = mountPanel()
  }
  function mountPanel() {
    bindParams()
    const markDirty = () => (dirty = true)
    return mount(tools, (ui) => {
      ui.select(settings, 'preset', { options: Object.keys(PRESETS), onChange: rebuild })
      ui.bool(settings, 'seamless', { onChange: rebuild })
      ui.group('Uniforms', (ui) => {
        for (const it of uniformList().filter((u) => u.type === 'f32')) {
          const { min, max, step } = it.options
          ui.scalar(params, it.name, { range: true, min, max, step: step ?? 0.001, decimals: 3, onInput: markDirty })
        }
      })
      ui.group('View', (ui) => {
        ui.select(settings, 'shape', { options: [SHADER_BALL, ...Object.keys(SHAPES)] })
        // whole numbers only, otherwise the texture is cut where the uv coordinates wrap around the mesh
        ui.scalar(settings, 'repeat', { range: true, min: 1, max: 8, step: 1 })
        ui.scalar(settings, 'emissive', { label: 'Emissive strength', range: true, min: 0, max: 20, step: 0.1 })
        ui.bool(settings, 'animate', { label: 'Animate z' })
        ui.scalar(settings, 'speed', { range: true, min: 0, max: 1, step: 0.01 })
        ui.bool(settings, 'autoRotate', { label: 'Auto rotate' })
      })
    })
  }

  // orbit camera, drag to rotate, wheel to zoom. The distance is relative to the radius of the shown mesh
  const orbit = { yaw: 0, pitch: 20, distance: 1.8 }
  const dragging = { active: false, x: 0, y: 0 }
  const onPointerDown = (e: PointerEvent) => {
    dragging.active = true
    dragging.x = e.clientX
    dragging.y = e.clientY
  }
  const onPointerUp = () => (dragging.active = false)
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging.active) {
      return
    }
    orbit.yaw -= (e.clientX - dragging.x) * 0.3
    orbit.pitch = Math.min(85, Math.max(-85, orbit.pitch + (e.clientY - dragging.y) * 0.3))
    dragging.x = e.clientX
    dragging.y = e.clientY
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    orbit.distance = Math.min(8, Math.max(1, orbit.distance * (1 + Math.sign(e.deltaY) * 0.1)))
  }
  canvas.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('wheel', onWheel, { passive: false })

  const world = mat4Identity()
  // repeats the maps over the mesh
  const textureMod = mat4Identity()
  const view = mat4Identity()
  const projection = mat4Identity()
  const eye = vec3()
  const target = vec3()

  function drawShaderBall(model: Model) {
    for (const node of model.sceneNodes) {
      const mesh = model.meshes[node.data?.mesh!]
      for (const it of mesh?.materials ?? []) {
        const mtl = it as CommonMaterial
        mtl.World = node.world
        mtl.View = view
        mtl.Projection = projection
        mtl.CameraPosition = eye
      }
    }
    model.draw()
  }

  const pass = device.renderPass
  const msaaColor = device.createRenderTarget({ format: device.output.format, sampleCount: 4 })
  const msaaDepth = device.createDepthTarget({ format: 'depth24plus', sampleCount: 4 })
  const sceneColor = device.createRenderTarget({
    format: device.output.format,
    usage: TextureUsage.TextureBinding,
  })
  const spriteBatch = new SpriteBatch(device)

  device.schedule((ctx) => {
    if (settings.animate) {
      for (const name of MAP_NAMES) {
        textures[name].z += ctx.delta * settings.speed
      }
      dirty = true
    }
    if (dirty) {
      // each update draws into its texture and flushes the pass. false while a shader compiles
      let ready = true
      for (const name of MAP_NAMES) {
        ready = textures[name].update(pass) && ready
      }
      dirty = !ready
    }

    if (settings.autoRotate && !dragging.active) {
      orbit.yaw += ctx.delta * 10
    }
    const ball = settings.shape === SHADER_BALL ? shaderBall : null
    const radius = ball ? ball.boundingSphere.radius : 1.5
    if (ball) {
      vec3Copy(ball.boundingSphere.center, target)
    } else {
      vec3$init(target, 0, 0, 0)
    }
    const yaw = orbit.yaw * DEGREE_TO_RAD
    const pitch = orbit.pitch * DEGREE_TO_RAD
    const distance = orbit.distance * radius
    eye.x = target.x + Math.cos(pitch) * Math.sin(yaw) * distance
    eye.y = target.y + Math.sin(pitch) * distance
    eye.z = target.z + Math.cos(pitch) * Math.cos(yaw) * distance
    mat4$initLookAt(view, eye, target, vec3.UnitY)
    mat4$invert(view)
    mat4$initPerspectiveFieldOfView(projection, 45 * DEGREE_TO_RAD, device.output.aspectRatio, 0.05, 100, device.ndcMinZ)

    // the shell of the shader ball is unwrapped into the whole uv square, it is not drawn until loaded
    const [u, v] = SHAPES[settings.shape]?.uv ?? [1, 1]
    const surface = ball ? (ball.meshes[SHADER_BALL_SHELL].materials[0] as CommonMaterial) : material
    surface.TextureMod = mat4$initScaleXYZ(textureMod, u * settings.repeat, v * settings.repeat, 1)
    surface.EmissiveStrength = settings.emissive
    material.World = world
    material.View = view
    material.Projection = projection
    material.CameraPosition = eye

    msaaColor.resizeToMatch(device.output)
    msaaDepth.resizeToMatch(device.output)
    sceneColor.resizeToMatch(device.output)
    pass.setRenderTarget(0, msaaColor, 0, 0, sceneColor)
    pass.setDepthTarget(msaaDepth)
    pass.setCullState(CullState.CullBack)
    pass.setDepthState(DepthState.LessEqual)
    pass.setRenderBlend(0, BlendState.Disabled)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.setClearDepth(1)
    pass.clear()

    const sky = skybox.materials[0] as SkyboxMaterial
    sky.ViewProjection = mat4Premultiply(view, projection)
    skybox.draw()
    if (ball) {
      drawShaderBall(ball)
    } else if (meshes[settings.shape]) {
      meshes[settings.shape].draw()
    }

    pass.submit()
    pass.resolve()
    pass.flush()

    // the scene and the color maps are linear, the canvas is sRGB
    spriteBatch.linearToSrgb = true
    spriteBatch.begin()
    spriteBatch
      .next(sceneColor)
      .destination(0, 0, sceneColor.width, sceneColor.height)
      .flipY(device.isWebGL2 && sceneColor.isRenderTarget)
    drawThumbnails(['base', 'emissive'])
    spriteBatch.end()
    pass.setRenderBlend(0, BlendState.Disabled)
    pass.render(spriteBatch)

    // the data maps are shown as they are stored
    spriteBatch.linearToSrgb = false
    spriteBatch.begin()
    drawThumbnails(['normal', 'orm'])
    spriteBatch.end()
    pass.render(spriteBatch)
    pass.submit()
    pass.flush()
  })

  // the baked maps in a column on the left
  function drawThumbnails(names: Array<keyof MaterialMaps>) {
    const size = Math.min(128, Math.floor((device.output.height - 50) / MAP_NAMES.length))
    for (const name of names) {
      const index = MAP_NAMES.indexOf(name)
      spriteBatch.next(textures[name].texture).destination(10, 10 + index * (size + 10), size, size)
    }
  }

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('wheel', onWheel)
    panel.dispose()
    for (const name of MAP_NAMES) {
      textures[name].dispose()
    }
    shaderBall?.dispose()
    spriteBatch.dispose()
    device.dispose()
  }
}
