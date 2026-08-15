import { Color, createDevice, Device, PlatformId, SamplerState } from '@gglib/graphics'
import { mountUi } from 'tweak-ui'

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform }).ready

  const shader = device.createShaderModule({
    wgsl: {
      source: wgslShader,
    },
    glsl: {
      vertex: glslVS,
      fragment: glslFS,
    },
  })

  const texture = device.createTexture({
    source: '/textures/prototype/proto_red.png',
  })

  // The UVs on this quad go from 0 to 3 instead of 0 to 1, so each edge of
  // the texture is sampled three times over. Depending on the sampler's
  // wrap mode, that either repeats the image (`Wrap`) or stretches its
  // border pixels (`Clamp`).
  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        vPosition: { byteOffset: 0, elementCount: 3, elementType: 'float32' },
        vTexture: { byteOffset: 12, elementCount: 2, elementType: 'float32' },
      },
      // prettier-ignore
      data: new Float32Array([
        -0.8, -0.8, 0.0,  0, 3,
         0.8, -0.8, 0.0,  3, 3,
        -0.8,  0.8, 0.0,  0, 0,
         0.8,  0.8, 0.0,  3, 0,
      ]),
    },
  ])
  const indices = device.createIndexBuffer({
    indexType: 'uint16',
    data: new Uint16Array([0, 2, 1, 1, 2, 3]),
  })

  const settings = {
    sampler: SamplerState.PointWrap,
  }
  mountUi(tools, (ui) => {
    ui.select(settings, 'sampler', {
      options: [
        { value: SamplerState.PointClamp, label: 'Point + Clamp' },
        { value: SamplerState.PointWrap, label: 'Point + Wrap' },
        { value: SamplerState.LinearClamp, label: 'Linear + Clamp' },
        { value: SamplerState.LinearWrap, label: 'Linear + Wrap' },
      ],
    })
  })

  const pass = device.renderPass
  function frame() {
    device.resize()
    if (!shader.isValid) {
      return
    }

    const program = shader.program

    // A `SamplerState` is a plain, cacheable value object - not a GPU
    // resource you create up front. It bundles filtering (point vs.
    // linear) and wrap mode (clamp vs. repeat) and can be swapped freely
    // between draw calls, even while reusing the same texture.
    if (device.isWebGL2) {
      // For GLSL, texture and sampler are combined into a single
      // `sampler2D` uniform, so both are set through the same `uTexture` key.
      program.set('uTexture', texture)
      program.set('uTexture', settings.sampler)
    } else {
      //  WGSL keeps them as two separate bindings, hence the extra
      // `uSampler` call below - it is simply ignored on the GLSL backend.
      program.set('uTexture', texture)
      program.set('uSampler', settings.sampler)
    }
    program.commit()

    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    pass.setProgram(program)
    pass.setVertexBuffer(vertices)
    pass.setIndexBuffer(indices)
    pass.drawIndexed(6)
    pass.submit()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

const glslVS = /*glsl*/ `
  #version 300 es
  in vec3 vPosition;
  in vec2 vTexture;
  out vec2 uv;
  void main(void) {
    uv = vTexture;
    gl_Position = vec4(vPosition, 1.0);
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision highp float;
  in vec2 uv;
  uniform sampler2D uTexture;
  out vec4 fragColor;
  void main(void) {
    fragColor = texture(uTexture, uv);
  }
`

const wgslShader = /*wgsl*/ `
  @group(0) @binding(0) var uTexture : texture_2d<f32>;
  @group(0) @binding(1) var uSampler : sampler;

  struct VertexInput {
    @location(0) vPosition : vec3<f32>,
    @location(1) vTexture : vec2<f32>,
  };

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) uv : vec2<f32>,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.uv = input.vTexture;
    output.Position = vec4<f32>(input.vPosition, 1.0);
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return textureSample(uTexture, uSampler, input.uv);
  }
`
