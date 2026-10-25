// #region imports
import {
  BlendState,
  Color,
  createDevice,
  createTextureSource,
  CullState,
  DepthState,
  Device,
  PlatformId,
  planeGeometry,
  SamplerState,
  Texture,
} from '@gglib/graphics'
import {
  DEGREE_TO_RAD,
  mat4$initLookAt,
  mat4$initPerspectiveFieldOfView,
  mat4$invert,
  mat4Identity,
  vec3,
} from '@gglib/math'
import {
  cell,
  clamp,
  fbm,
  type Field,
  type FractalOptions,
  hybrid,
  perlin,
  pow,
  ProceduralTexture,
  remap,
  ridged,
  scale,
  shift,
  simplex,
  uniform,
  value,
  warp,
} from '@gglib/noise'
import { mount } from 'tweak-ui'
// #endregion

// heightmap texels and grid vertices per side
const RESOLUTION = 256
// size of the terrain in world units
const TERRAIN_SIZE = 10
// the area of the noise that is baked: [x0, y0, x1, y1]
const REGION: [number, number, number, number] = [0, 0, 2.5, 2.5]

const SOURCES: Record<string, () => Field<any>> = {
  perlin,
  simplex,
  value,
  cell: () => cell().pipe(remap(0, 1, -1, 1)),
}

interface Fractal {
  operator: (options: FractalOptions) => (source: Field<any>) => Field<any>
  // output range with 6 octaves (measured), mapped to [0, 1]
  range: [number, number]
}

const FRACTALS: Record<string, Fractal> = {
  ridged: { operator: (options) => ridged(options), range: [0.3, 1.9] },
  fbm: { operator: (options) => fbm(options), range: [-0.7, 0.9] },
  hybrid: { operator: (options) => hybrid(options), range: [0.3, 1.95] },
  none: { operator: () => (source) => source, range: [-1, 1] },
}

/**
 * The structure of the graph. Changing it builds a new graph and compiles a new shader
 */
interface Structure {
  source: string
  fractal: string
  maxOctaves: number
  warp: boolean
}

/**
 * Builds the terrain height field. Its uniforms can be tweaked without a recompile
 */
function buildTerrain(structure: Structure): Field<any> {
  const fractal = FRACTALS[structure.fractal]
  let field = SOURCES[structure.source]().pipe(
    shift(uniform('seed', 0, { min: 0, max: 100, step: 1 })),
    fractal.operator({
      octaves: uniform('octaves', 6, { min: 1, max: structure.maxOctaves, step: 1 }),
      maxOctaves: structure.maxOctaves,
      lacunarity: uniform('lacunarity', 2, { min: 1.5, max: 3 }),
      gain: uniform('gain', 0.5, { min: 0.2, max: 0.8 }),
    }),
    remap(fractal.range[0], fractal.range[1], 0, 1),
    clamp(0, 1),
    // flattens valleys and sharpens peaks
    pow(uniform('exponent', 2, { min: 0.5, max: 4 })),
    scale(uniform('frequency', 1, { min: 0.2, max: 4 })),
  )
  if (structure.warp) {
    field = field.pipe(warp(simplex().pipe(scale(0.5)), uniform('warp', 0.5, { min: 0, max: 2 })))
  }
  return field
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const structure: Structure = { source: 'perlin', fractal: 'ridged', maxOctaves: 10, warp: true }
  const settings = { mode: 'gpu', height: 2, autoRotate: true }

  let field = buildTerrain(structure)
  let dirty = true

  // GPU: the field is baked by a generated shader. CPU: the field is sampled in JS and uploaded
  const baked = new ProceduralTexture(device, field, { width: RESOLUTION, height: RESOLUTION, region: REGION })
  const sampled = device.createTexture({
    width: RESOLUTION,
    height: RESOLUTION,
    format: 'r32float',
    source: new Float32Array(RESOLUTION * RESOLUTION),
  })

  function sampleOnCpu() {
    const [x0, y0, x1, y1] = REGION
    const data = new Float32Array(RESOLUTION * RESOLUTION)
    for (let j = 0; j < RESOLUTION; j++) {
      const y = y0 + ((j + 0.5) / RESOLUTION) * (y1 - y0)
      for (let i = 0; i < RESOLUTION; i++) {
        data[j * RESOLUTION + i] = field.sample(x0 + ((i + 0.5) / RESOLUTION) * (x1 - x0), y)
      }
    }
    sampled.setDataFromSource(createTextureSource(data, { width: RESOLUTION, height: RESOLUTION, format: 'r32float' }))
  }

  function rebuild() {
    // keep the tweaked values of uniforms that exist in the new graph
    const values = { ...field.params }
    field = buildTerrain(structure)
    for (const name of Object.keys(field.params)) {
      if (name in values) {
        field.params[name] = values[name]
      }
    }
    baked.field = field
    dirty = true
    remountPanel()
  }

  let panel = mountPanel()
  function remountPanel() {
    panel.dispose()
    panel = mountPanel()
  }
  function mountPanel() {
    const markDirty = () => (dirty = true)
    return mount(tools, (ui) => {
      ui.group('Graph (recompiles)', (ui) => {
        ui.select(structure, 'source', { options: Object.keys(SOURCES), onChange: rebuild })
        ui.select(structure, 'fractal', { options: Object.keys(FRACTALS), onChange: rebuild })
        ui.scalar(structure, 'maxOctaves', { range: true, min: 1, max: 16, step: 1, onChange: rebuild })
        ui.bool(structure, 'warp', { onChange: rebuild })
      })
      ui.group('Uniforms (no recompile)', (ui) => {
        for (const it of field.uniformList) {
          const { min, max, step } = it.options
          // onInput fires while dragging, the heightmap is re-baked live
          ui.scalar(field.params, it.name, { range: true, min, max, step: step ?? 0.01, onInput: markDirty })
        }
      })
      ui.group('Terrain', (ui) => {
        ui.select(settings, 'mode', {
          options: [
            { value: 'gpu', label: 'GPU (ProceduralTexture)' },
            { value: 'cpu', label: 'CPU (field.sample)' },
          ],
          onChange: markDirty,
        })
        ui.scalar(settings, 'height', { range: true, min: 0, max: 6, step: 0.01 })
        ui.bool(settings, 'autoRotate', { label: 'Auto rotate' })
      })
    })
  }

  const geometry = planeGeometry(device, { size: TERRAIN_SIZE, segments: RESOLUTION - 1 })
  // the terrain occludes itself, so it needs a depth buffer. The render pass has none by default,
  // render into a multisampled color and depth target and resolve into the canvas
  const depthTarget: Texture = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'depth24plus',
    sampleCount: 4,
  })
  const colorTarget: Texture = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })
  const shader = device.createShaderModule({
    wgsl: { source: TERRAIN_WGSL },
    glsl: { vertex: TERRAIN_GLSL_VS, fragment: TERRAIN_GLSL_FS },
  })

  // orbit camera, drag to rotate, wheel to zoom
  const orbit = { yaw: 30, pitch: 35, distance: 12 }
  const dragging = { active: false, x: 0, y: 0 }
  canvas.addEventListener('pointerdown', (e) => {
    dragging.active = true
    dragging.x = e.clientX
    dragging.y = e.clientY
  })
  const onPointerUp = () => (dragging.active = false)
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging.active) {
      return
    }
    orbit.yaw -= (e.clientX - dragging.x) * 0.3
    orbit.pitch = Math.min(85, Math.max(5, orbit.pitch + (e.clientY - dragging.y) * 0.3))
    dragging.x = e.clientX
    dragging.y = e.clientY
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    orbit.distance = Math.min(30, Math.max(3, orbit.distance * (1 + Math.sign(e.deltaY) * 0.1)))
  }
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('wheel', onWheel, { passive: false })

  const view = mat4Identity()
  const projection = mat4Identity()
  const eye = vec3()
  const target = vec3(0, 0.8, 0)

  const pass = device.renderPass
  device.schedule((ctx) => {
    if (dirty && settings.mode === 'cpu') {
      sampleOnCpu()
      dirty = false
    }
    if (dirty && settings.mode === 'gpu') {
      // renders into the heightmap and flushes the pass, false while the shader compiles
      dirty = !baked.update(pass)
    }

    if (settings.autoRotate && !dragging.active) {
      orbit.yaw += ctx.delta * 10
    }
    const yaw = orbit.yaw * DEGREE_TO_RAD
    const pitch = orbit.pitch * DEGREE_TO_RAD
    eye.x = Math.cos(pitch) * Math.sin(yaw) * orbit.distance
    eye.y = Math.sin(pitch) * orbit.distance
    eye.z = Math.cos(pitch) * Math.cos(yaw) * orbit.distance
    mat4$initLookAt(view, eye, target, vec3.UnitY)
    mat4$invert(view)
    mat4$initPerspectiveFieldOfView(projection, 50 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    // after the bake above, which flushes the pass and resets its state
    depthTarget.resizeToMatch(device.output)
    colorTarget.resizeToMatch(device.output)
    pass.setRenderTarget(0, colorTarget, 0, 0, device.output)
    pass.setDepthTarget(depthTarget)
    pass.setClearColor(0, Color.create(0.55, 0.7, 0.85, 1))
    pass.setClearDepth(1)
    pass.clear()
    if (!shader.isValid) {
      pass.resolve()
      pass.flush()
      return
    }

    const heightmap: Texture = settings.mode === 'gpu' ? baked.texture : sampled
    const program = shader.program
    program.set('terrain.view', view)
    program.set('terrain.projection', projection)
    program.set('terrain.height', settings.height)
    program.set('terrain.resolution', RESOLUTION)
    program.set('terrain.spacing', TERRAIN_SIZE / (RESOLUTION - 1))
    program.set('heightmap', heightmap)
    if (device.isWebGL2) {
      // float textures are not filterable everywhere, texelFetch needs a complete texture
      program.set('heightmap', SamplerState.PointClamp)
    }
    program.commit()

    pass.setDepthState(DepthState.LessEqual)
    pass.setCullState(CullState.None)
    pass.setRenderBlend(0, BlendState.Disabled)
    pass.setProgram(program)
    pass.render(geometry)
    pass.resolve()
    pass.submit()
    pass.flush()
  })

  return () => {
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('wheel', onWheel)
    panel.dispose()
    baked.dispose()
    sampled.dispose()
    depthTarget.dispose()
    colorTarget.dispose()
    geometry.dispose()
    device.dispose()
  }
}

// The terrain material belongs to the application: it reads the baked heightmap with textureLoad / texelFetch,
// displaces the grid and derives normals from the neighbouring texels.

const TERRAIN_WGSL = /* wgsl */ `
struct TerrainParams {
  view: mat4x4f,
  projection: mat4x4f,
  height: f32,
  resolution: f32,
  spacing: f32,
}
@group(0) @binding(0) var<uniform> terrain: TerrainParams;
@group(0) @binding(1) var heightmap: texture_2d<f32>;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) texture: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) height: f32,
}

fn heightAt(texel: vec2i) -> f32 {
  let last = i32(terrain.resolution) - 1;
  return textureLoad(heightmap, clamp(texel, vec2i(0), vec2i(last)), 0).r * terrain.height;
}

@vertex
fn vs(input: VertexInput) -> VertexOutput {
  let texel = vec2i(input.texture * (terrain.resolution - 1.0) + 0.5);
  let h = heightAt(texel);
  let dx = heightAt(texel + vec2i(1, 0)) - heightAt(texel - vec2i(1, 0));
  let dz = heightAt(texel + vec2i(0, 1)) - heightAt(texel - vec2i(0, 1));

  var output: VertexOutput;
  output.position = terrain.projection * terrain.view * vec4f(input.position.x, h, input.position.z, 1.0);
  output.normal = normalize(vec3f(-dx, 2.0 * terrain.spacing, -dz));
  output.height = h / max(terrain.height, 0.0001);
  return output;
}

@fragment
fn fs(input: VertexOutput) -> @location(0) vec4f {
  let normal = normalize(input.normal);
  let slope = 1.0 - normal.y;
  var color = mix(vec3f(0.25, 0.45, 0.2), vec3f(0.45, 0.4, 0.3), smoothstep(0.25, 0.55, input.height));
  color = mix(color, vec3f(0.4, 0.38, 0.36), smoothstep(0.15, 0.35, slope));
  color = mix(color, vec3f(0.95, 0.96, 1.0), smoothstep(0.7, 0.8, input.height) * (1.0 - smoothstep(0.3, 0.5, slope)));
  let light = max(dot(normal, normalize(vec3f(0.5, 0.8, 0.3))), 0.0) * 0.85 + 0.15;
  return vec4f(color * light, 1.0);
}
`

const TERRAIN_GLSL_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

// @block terrain
layout(std140) uniform TerrainParams {
  mat4 view;
  mat4 projection;
  float height;
  float resolution;
  float spacing;
} terrain;
uniform highp sampler2D heightmap;

in vec3 position;
in vec2 texture;
out vec3 vNormal;
out float vHeight;

float heightAt(ivec2 texel) {
  int last = int(terrain.resolution) - 1;
  return texelFetch(heightmap, clamp(texel, ivec2(0), ivec2(last)), 0).r * terrain.height;
}

void main(void) {
  ivec2 texel = ivec2(texture * (terrain.resolution - 1.0) + 0.5);
  float h = heightAt(texel);
  float dx = heightAt(texel + ivec2(1, 0)) - heightAt(texel - ivec2(1, 0));
  float dz = heightAt(texel + ivec2(0, 1)) - heightAt(texel - ivec2(0, 1));
  gl_Position = terrain.projection * terrain.view * vec4(position.x, h, position.z, 1.0);
  vNormal = normalize(vec3(-dx, 2.0 * terrain.spacing, -dz));
  vHeight = h / max(terrain.height, 0.0001);
}
`

const TERRAIN_GLSL_FS = /* glsl */ `#version 300 es
precision highp float;

in vec3 vNormal;
in float vHeight;
out vec4 fragColor;

void main(void) {
  vec3 normal = normalize(vNormal);
  float slope = 1.0 - normal.y;
  vec3 color = mix(vec3(0.25, 0.45, 0.2), vec3(0.45, 0.4, 0.3), smoothstep(0.25, 0.55, vHeight));
  color = mix(color, vec3(0.4, 0.38, 0.36), smoothstep(0.15, 0.35, slope));
  color = mix(color, vec3(0.95, 0.96, 1.0), smoothstep(0.7, 0.8, vHeight) * (1.0 - smoothstep(0.3, 0.5, slope)));
  float light = max(dot(normal, normalize(vec3(0.5, 0.8, 0.3))), 0.0) * 0.85 + 0.15;
  fragColor = vec4(color * light, 1.0);
}
`
