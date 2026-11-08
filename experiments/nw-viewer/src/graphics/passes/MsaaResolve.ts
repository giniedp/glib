import { DepthState, type RenderEncoder, type Texture } from '@gglib/graphics'
import type { FrameResource } from '@gglib/render'

/**
 * Resolves a multisampled texture into a single sampled texture
 */
export interface MsaaResolver {
  resolve(pass: RenderEncoder, input: Texture, output: Texture): void
}

/**
 * Resolves msaa resources into single sampled resources.
 * Channels with a custom resolver are resolved with a fullscreen draw, others with a hardware resolve.
 * A missing output (null) skips the channel.
 */
export function resolveTargets(
  pass: RenderEncoder,
  inputs: FrameResource[],
  outputs: Array<FrameResource | null>,
  resolver: Array<MsaaResolver | null>,
) {
  pass.setDepthTarget(null)
  pass.setDepthState(DepthState.Disabled)

  // hardware resolve
  let hasHardwareResolve = false
  for (let i = 0; i < inputs.length; i++) {
    if (outputs[i] && !resolver[i]) {
      pass.setRenderTarget(i, inputs[i].texture, 0, 0, outputs[i].texture)
      hasHardwareResolve = true
    } else {
      pass.setRenderTarget(i, null)
    }
  }
  if (hasHardwareResolve) {
    pass.resolve()
  }
  for (let i = 0; i < inputs.length; i++) {
    pass.setRenderTarget(i, null)
  }

  // custom resolve
  for (let i = 0; i < inputs.length; i++) {
    if (outputs[i] && resolver[i]) {
      resolver[i].resolve(pass, inputs[i].texture, outputs[i].texture)
      pass.setRenderTarget(0, null)
    }
  }
}
