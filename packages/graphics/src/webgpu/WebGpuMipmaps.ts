import { SamplerState } from '../states'
import type { WebGpuShaderModule, WebGpuTexture } from './resources'
import type { WebGpuDevice } from './WebGpuDevice'
import { WebGpuRenderEncoder } from './WebGpuRenderEncoder'

export class WebGpuMipmaps {
  private mipmap2dProgram: WebGpuShaderModule
  private mipmap2dArrayProgram: WebGpuShaderModule
  private mipmapCubeProgram: WebGpuShaderModule
  private mipmapCubeArrayProgram: WebGpuShaderModule
  private renderPass: WebGpuRenderEncoder
  public constructor(device: WebGpuDevice) {
    this.mipmap2dProgram ||= device.createWgslModule({ name: 'MIPMAPS_2D', code: MIPMAPS_2D })
    this.mipmap2dArrayProgram ||= device.createWgslModule({ name: 'MIPMAPS_2D_ARRAY', code: MIPMAPS_2D_ARRAY })
    this.mipmapCubeProgram ||= device.createWgslModule({ name: 'MIPMAPS_CUBE', code: MIPMAPS_CUBE })
    this.mipmapCubeArrayProgram ||= device.createWgslModule({ name: 'MIPMAPS_CUBE_ARRAY', code: MIPMAPS_CUBE_ARRAY })
    this.renderPass = new WebGpuRenderEncoder(device)
  }

  public generate(texture: WebGpuTexture, startLayer = 0, endLayer = texture.depth) {
    let program: WebGpuShaderModule
    let dimension: GPUTextureViewDimension = '2d'
    switch (texture.gpuViewDimension) {
      case '2d':
        program = this.mipmap2dProgram
        break
      case '2d-array':
        program = this.mipmap2dArrayProgram
        dimension = '2d-array'
        break
      case 'cube':
        program = this.mipmapCubeProgram
        dimension = 'cube'
        break
      case 'cube-array':
        program = this.mipmapCubeArrayProgram
        break
      default:
        throw new Error(`Unsupported texture dimension: ${texture.gpuViewDimension}`)
    }

    const pass = this.renderPass
    for (let level = 1; level < texture.mipLevelCount; level++) {
      program.program.mustGet('textureMapSampler').set(SamplerState.LinearClampNoMipMap)
      program.program.mustGet('textureMap').set(
        texture.gpuObject.createView({
          dimension,
          baseMipLevel: level - 1,
          mipLevelCount: 1,
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
        }) as any,
      )

      for (let layer = startLayer; layer < endLayer; layer++) {
        pass.setRenderTarget(0, texture, level, layer)
        pass.setViewportState(0, 0, Math.max(1, texture.width >> level), Math.max(1, texture.height >> level))
        pass.setProgram(program.program)
        pass.draw(3, 1, 0, layer)
      }
    }

    pass.flush()
  }
}
const commmons = /* wgsl */ `
  const faceMat = array(
    mat3x3f( 0,  0,  -2,  0, -2,   0,  1,  1,   1),   // +x
    mat3x3f( 0,  0,   2,  0, -2,   0, -1,  1,  -1),   // -x
    mat3x3f( 2,  0,   0,  0,  0,   2, -1,  1,  -1),   // +y
    mat3x3f( 2,  0,   0,  0,  0,  -2, -1, -1,   1),   // -y
    mat3x3f( 2,  0,   0,  0, -2,   0, -1,  1,   1),   // +z
    mat3x3f(-2,  0,   0,  0, -2,   0,  1,  1,  -1));  // -z

  struct VSOutput {
    @builtin(position)
    position: vec4f,

    @location(0)
    texcoord: vec2f,

    @location(1)
    @interpolate(flat, either)
    baseArrayLayer: u32,
  };

  @vertex
  fn vertexMain(
    @builtin(vertex_index) vertexIndex : u32,
    @builtin(instance_index) instanceIndex : u32
  ) -> VSOutput {
    var pos = array<vec2f, 3>(
      vec2f(-1.0, -1.0),
      vec2f(-1.0,  3.0),
      vec2f( 3.0, -1.0),
    );

    let xy = pos[vertexIndex];

    var out: VSOutput;
    out.position = vec4f(xy, 0.0, 1.0);
    out.texcoord = xy * vec2f(0.5, -0.5) + vec2f(0.5);
    out.baseArrayLayer = instanceIndex;

    return out;
  }
`

const MIPMAPS_2D = /* wgsl */ `
  ${commmons}

  @group(0)
  @binding(0)
  var textureMapSampler: sampler;

  @group(0)
  @binding(1)
  var textureMap: texture_2d<f32>;

  @fragment
  fn fragmentMain(input: VSOutput) -> @location(0) vec4f {
    return textureSample(textureMap, textureMapSampler, input.texcoord);
  }
`

const MIPMAPS_2D_ARRAY = /* wgsl */ `
  ${commmons}

  @group(0)
  @binding(0)
  var textureMapSampler: sampler;

  @group(0)
  @binding(1)
  var textureMap: texture_2d_array<f32>;

  @fragment
  fn fragmentMain(input: VSOutput) -> @location(0) vec4f {
    return textureSample(
      textureMap,
      textureMapSampler,
      input.texcoord,
      input.baseArrayLayer);
  }
`

const MIPMAPS_CUBE = /* wgsl */ `
  ${commmons}

  @group(0)
  @binding(0)
  var textureMapSampler: sampler;

  @group(0)
  @binding(1)
  var textureMap: texture_cube<f32>;

  @fragment
  fn fragmentMain(input: VSOutput) -> @location(0) vec4f {
    let uv = faceMat[input.baseArrayLayer] * vec3f(fract(input.texcoord), 1);
    return textureSample(textureMap, textureMapSampler, uv);
  }
`

const MIPMAPS_CUBE_ARRAY = /* wgsl */ `
  ${commmons}

  @group(0)
  @binding(0)
  var textureMapSampler: sampler;

  @group(0)
  @binding(1)
  var textureMap: texture_cube_array<f32>;

  @fragment
  fn fragmentMain(fsInput: VSOutput) -> @location(0) vec4f {
    let uv = faceMat[fsInput.baseArrayLayer] * vec3f(fract(fsInput.texcoord), 1);
    return textureSample(textureMap, textureMapSampler, uv, fsInput.baseArrayLayer);
  }
`
