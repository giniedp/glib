import { FULLSCREEN_WGSL_VS } from '@gglib/effects'
import {
  BlendState,
  CullState,
  DepthState,
  FALSE,
  inputSlot,
  TRUE,
  typedProgramInputs,
  type Device,
  type Program,
  type RenderEncoder,
  type ShaderModuleOptions,
  type Texture,
} from '@gglib/graphics'
import type { MsaaResolver } from './MsaaResolve'

export type DepthResolveOperator = 'min' | 'max'

const DEPTH_RESOLVE_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

const RESOLVE_MIN : i32 = 0;
const RESOLVE_MAX : i32 = 1;

struct Uniforms {
  operatorId: i32,
};

// @block params
@group(0) @binding(0) var<uniform> params: Uniforms;
// @block params
@group(0) @binding(1) var depthMap: texture_multisampled_2d<f32>;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let px = vec2i(in.position.xy);
  let count = i32(textureNumSamples(depthMap));
  var result = textureLoad(depthMap, px, 0).r;
  for (var i = 1; i < count; i = i + 1) {
    let d = textureLoad(depthMap, px, i).r;
    if (params.operatorId == RESOLVE_MAX) {
      result = max(result, d);
    } else {
      result = min(result, d);
    }
  }
  return vec4f(result, 0.0, 0.0, 1.0);
}
`

function depthResolveShaderOptions(): ShaderModuleOptions {
  return {
    name: 'NW Depth Resolve Shader',
    wgsl: { source: DEPTH_RESOLVE_WGSL },
  }
}

/**
 * Resolves a multisampled depth texture (stored in a color channel, e.g. linear depth)
 * by picking the min or max sample instead of averaging.
 *
 * Averaging depth samples produces depth values at silhouettes that belong to neither surface.
 */
export class DepthResolveEffect implements MsaaResolver {
  public program: Program
  public readonly params = typedProgramInputs({
    depthMap: inputSlot('params', 'depthMap', 'texture'),
    operatorId: inputSlot('params', 'operatorId', 'scalar'),
  })

  public readonly compiled: Promise<this>
  public get isCompiled() {
    return !!this.program?.isCompiled
  }

  public operator: DepthResolveOperator

  public constructor(device: Device, options?: { operator?: DepthResolveOperator }) {
    this.operator = options?.operator ?? 'min'
    device.ready.then(() => {
      this.program = device.createShaderModule(depthResolveShaderOptions()).program.clone()
    })
    this.compiled = device.ready.then(() => this.program.compiled).then(() => this)
  }

  public resolve(pass: RenderEncoder, input: Texture, output: Texture) {
    if (!this.program) {
      return
    }
    this.params.depthMap = input
    this.params.operatorId = this.operator === 'max' ? TRUE : FALSE
    this.program.applyBlocks(this.params.blocks)
    this.program.commit()

    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.setCullState(CullState.Disabled)
    pass.setRenderTarget(0, output)
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.setViewportState(0, 0, output.width, output.height)
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
  }
}
