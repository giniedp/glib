import { Color, createDevice, Device, PlatformId, StencilState, Texture } from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

// Writes a `1` into the stencil buffer everywhere this draw call's pixels
// land, and never touches the color buffer (that is handled separately via
// `setRenderMask`).
const WRITE_MASK = StencilState.get({
  enable: true,
  readMask: 0xff,
  writeMask: 0xff,
  frontFunction: 'Always',
  frontFail: 'Keep',
  frontDepthFail: 'Keep',
  frontDepthPass: 'Replace',
  backFunction: 'Always',
  backFail: 'Keep',
  backDepthFail: 'Keep',
  backDepthPass: 'Replace',
})

// Only lets a pixel through where the stencil buffer already holds the
// reference value written above.
const TEST_MASK = StencilState.get({
  enable: true,
  readMask: 0xff,
  writeMask: 0x00,
  frontFunction: 'Equal',
  frontFail: 'Keep',
  frontDepthFail: 'Keep',
  frontDepthPass: 'Keep',
  backFunction: 'Equal',
  backFail: 'Keep',
  backDepthFail: 'Keep',
  backDepthPass: 'Keep',
})

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const shader = device.createShaderModule({
    wgsl: {
      source: wgslShader,
    },
    glsl: {
      vertex: glslVS,
      fragment: glslFS,
    },
  })

  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        vPosition: { byteOffset: 0, elementCount: 3, elementType: 'float32' },
        vTexture: { byteOffset: 12, elementCount: 2, elementType: 'float32' },
      },
      // prettier-ignore
      data: new Float32Array([
        -0.5, -0.5, 0.0,  0, 1,
         0.5, -0.5, 0.0,  1, 1,
        -0.5,  0.5, 0.0,  0, 0,
         0.5,  0.5, 0.0,  1, 0,
      ]),
    },
  ])
  const indices = device.createIndexBuffer({
    indexType: 'uint16',
    data: new Uint16Array([0, 2, 1, 1, 2, 3]),
  })

  const texture = device.createTexture({
    source: '/textures/prototype/proto_red.png',
  })

  // A diamond (a unit quad rotated 45 degrees) used as the mask shape, and
  // a second quad scaled up to cover the whole screen for the actual
  // content.
  const maskWorld = Mat4.createIdentity()
    .rotateZ(45 * DEGREE_TO_RAD)
    .scale(vec3(0.7, 0.7, 1))
  const contentWorld = Mat4.createScaleUniform(2)

  const settings = {
    masked: true,
  }
  mountUi(tools, (ui) => {
    ui.bool(settings, 'masked')
  })

  const depthTarget: Texture = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS_STENCIL8',
    sampleCount: 4,
  })
  const renderTarget: Texture = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })

  const pass = device.renderPass
  function frame() {
    depthTarget.resizeToMatch(device.output)
    renderTarget.resizeToMatch(device.output)

    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setClearStencil(0)
    pass.setRenderTarget(0, renderTarget, 0, 0, device.output)
    pass.setDepthTarget(depthTarget)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    const program = shader.program
    program.set('uTexture', texture)
    pass.setProgram(program)
    pass.setVertexBuffer(vertices)
    pass.setIndexBuffer(indices)

    if (settings.masked) {
      // Pass 1: stamp the diamond shape into the stencil buffer only - the
      // color mask of `0` means this draw call is otherwise invisible.
      pass.setRenderMask(0, 0)
      pass.setStencilState(WRITE_MASK)
      pass.setStencilReference(1)
      program.set('uWorld', maskWorld)
      program.commit()
      pass.drawIndexed(6)

      // Pass 2: draw the content quad normally, but only where the
      // stencil buffer equals the reference value stamped above.
      pass.setRenderMask(0, 1 | 2 | 4 | 8)
      pass.setStencilState(TEST_MASK)
      pass.setStencilReference(1)
    } else {
      pass.setStencilState(StencilState.Default)
    }

    program.set('uWorld', contentWorld)
    program.commit()
    pass.drawIndexed(6)

    pass.submit()
    pass.resolve()
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
  uniform mat4 uWorld;
  out vec2 uv;
  void main(void) {
    uv = vTexture;
    gl_Position = uWorld * vec4(vPosition, 1.0);
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
  @group(0) @binding(0) var<uniform> uWorld : mat4x4<f32>;
  @group(0) @binding(1) var uTexture : texture_2d<f32>;
  @group(0) @binding(2) var uSampler : sampler;

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
    output.Position = uWorld * vec4<f32>(input.vPosition, 1.0);
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return textureSample(uTexture, uSampler, input.uv);
  }
`
