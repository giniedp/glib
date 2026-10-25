import {
  BlendState,
  CullState,
  DepthState,
  type Device,
  type Ownable,
  type RenderEncoder,
  ResourceOwnership,
  type ShaderModule,
  type SurfaceFormat,
  type Texture,
  TextureUsage,
} from '@gglib/graphics'
import { type ShaderCode, toGlsl, toWgsl } from './emit/emit'
import type { Field } from './Field'
import type { Vec4 } from './types'

/**
 * Options of a {@link ProceduralTexture}
 *
 * @public
 */
export interface ProceduralTextureOptions {
  width: number
  height: number
  /**
   * Format of the texture. Defaults to `r32float`. Float formats keep negative values and the full range
   */
  format?: SurfaceFormat
  /**
   * Area of the field that is baked: `[x0, y0, x1, y1]`. Texel row 0 is at `y0`. Defaults to `[0, 0, 1, 1]`
   */
  region?: Vec4
  /**
   * The z coordinate of the baked slice, e.g. a time. Defaults to `0`
   */
  z?: number
  /**
   * Allocates the full mip chain and generates it on every {@link ProceduralTexture.update}, e.g. for tiled
   * material maps. Defaults to `false`
   */
  mipmaps?: boolean
}

/**
 * Bakes a field into a texture on the GPU
 *
 * @public
 * @remarks
 * The texel at column `i` and row `j` holds the field at
 * `x = x0 + (i + 0.5) / width * (x1 - x0)`, `y = y0 + (j + 0.5) / height * (y1 - y0)`.
 *
 * Call {@link ProceduralTexture.update} after changing `field.params`, `region` or `z`. It draws into the texture and
 * flushes the render pass, which resets the pass state. Setting a new {@link ProceduralTexture.field} compiles a new
 * shader.
 *
 * @example
 * ```ts
 * const heights = new ProceduralTexture(device, terrain, { width: 256, height: 256, region: [0, 0, 8, 8] })
 * terrain.params.gain = 0.6
 * heights.update()
 * ```
 */
export class ProceduralTexture implements Ownable {
  /**
   * The ownership state of this texture
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  /**
   * The baked texture
   */
  public readonly texture: Texture

  /**
   * Area of the field that is baked: `[x0, y0, x1, y1]`
   */
  public region: Vec4

  /**
   * The z coordinate of the baked slice
   */
  public z: number

  /**
   * Whether the mip chain is generated on update
   */
  public readonly mipmaps: boolean

  private currentField: Field<any>
  private shader: ShaderModule | null = null
  private code: ShaderCode

  public constructor(
    private readonly device: Device,
    field: Field<any>,
    options: ProceduralTextureOptions,
  ) {
    this.region = options.region ? [...options.region] : [0, 0, 1, 1]
    this.z = options.z ?? 0
    this.mipmaps = !!options.mipmaps
    this.texture = this.ownership.adopt(
      device.createRenderTarget({
        name: 'ProceduralTexture',
        width: options.width,
        height: options.height,
        format: options.format ?? 'r32float',
        usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
        // render targets have a single level by default
        mipLevelCount: this.mipmaps ? Math.floor(Math.log2(Math.max(options.width, options.height))) + 1 : 1,
      }),
    )
    this.field = field
  }

  /**
   * The baked field. Setting it compiles a new shader, call {@link ProceduralTexture.update} afterwards
   */
  public get field(): Field<any> {
    return this.currentField
  }
  public set field(field: Field<any>) {
    this.currentField = field
    // the noise uniforms are bound after the uniforms of the procedural pass
    const options = { binding: 1 }
    this.code = toWgsl(field, options)
    const glsl = toGlsl(field, options)
    if (this.shader) {
      this.ownership.drop(this.shader)
    }
    this.shader = this.ownership.adopt(
      this.device.createShaderModule({
        name: 'ProceduralTexture',
        wgsl: { source: wgslSource(this.code) },
        glsl: { vertex: GLSL_VERTEX, fragment: glslFragment(glsl) },
      }),
    )
  }

  /**
   * Whether the shader is compiled and the texture can be updated
   */
  public get isReady(): boolean {
    return !!this.shader?.isValid
  }

  /**
   * Renders the field into the texture with the current params
   *
   * @returns `false` if the shader is not ready yet
   */
  public update(pass: RenderEncoder = this.device.renderPass): boolean {
    if (!this.isReady) {
      return false
    }
    const program = this.shader.program
    program.set('procedural.region', this.region)
    program.set('procedural.size', [this.texture.width, this.texture.height])
    program.set('procedural.z', this.z)
    const params = this.currentField.params
    for (const uniform of this.code.uniforms) {
      program.set(uniform.path, params[uniform.name])
    }
    program.commit()

    pass.setRenderTarget(0, this.texture)
    // a depth target of the caller would not match the size of this texture
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.setViewportState(0, 0, this.texture.width, this.texture.height)
    pass.setCullState(CullState.None)
    // values are written as they are, 32 bit float targets can't blend without an extension
    pass.setRenderBlend(0, BlendState.Disabled)
    pass.setProgram(program)
    pass.draw(3)
    // ends the pass and resets the state, so the next draw does not render into this texture
    pass.flush()
    if (this.mipmaps) {
      this.texture.updateMipmaps()
    }
    return true
  }

  /**
   * Immediately finalizes the texture and the shader
   */
  public dispose() {
    this.ownership.finalize()
  }
}

function wgslSource(code: ShaderCode): string {
  return /* wgsl */ `
${code.code}

struct ProceduralParams {
  region: vec4f,
  size: vec2f,
  z: f32,
}
@group(0) @binding(0) var<uniform> procedural: ProceduralParams;

@vertex
fn vs(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let pos = vec2f(select(-1.0, 3.0, index == 2u), select(-1.0, 3.0, index == 1u));
  return vec4f(pos, 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) coord: vec4f) -> @location(0) vec4f {
  // the fragment row is the texel row in WebGPU and WebGL alike
  let uv = coord.xy / procedural.size;
  let p = vec3f(mix(procedural.region.xy, procedural.region.zw, uv), procedural.z);
  // a scalar field stands for (v, v, v, v), a color field is written as it is
  return vec4f(${code.entry}(p));
}
`
}

const GLSL_VERTEX = /* glsl */ `#version 300 es
void main(void) {
  vec2 pos = vec2(gl_VertexID == 2 ? 3.0 : -1.0, gl_VertexID == 1 ? 3.0 : -1.0);
  gl_Position = vec4(pos, 0.0, 1.0);
}
`

function glslFragment(code: ShaderCode): string {
  return /* glsl */ `#version 300 es
precision highp float;
precision highp int;

${code.code}

// @block procedural
layout(std140) uniform ProceduralParams {
  vec4 region;
  vec2 size;
  float z;
} procedural;

out vec4 fragColor;

void main(void) {
  vec2 uv = gl_FragCoord.xy / procedural.size;
  vec3 p = vec3(mix(procedural.region.xy, procedural.region.zw, uv), procedural.z);
  // a scalar field stands for (v, v, v, v), a color field is written as it is
  fragColor = vec4(${code.entry}(p));
}
`
}
