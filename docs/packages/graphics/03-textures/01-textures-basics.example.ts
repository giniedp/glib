import { Color, createDevice, Device, PlatformId } from '@gglib/graphics'

export default async function run(canvas: HTMLCanvasElement, _: any, platform: PlatformId) {
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

  // A texture is created like any other resource. Passing a URL as `source`
  // loads the image asynchronously in the background - there is no need to
  // await it here, the texture simply renders as transparent until the
  // image has arrived.
  const texture = device.createTexture({
    source: '/textures/prototype/proto_red.png',
  })

  // Same rectangle as in the Fundamentals section, but each vertex now
  // carries a `vTexture` attribute instead of a color: two floats (u, v)
  // that say which point of the image maps to that corner. (0, 0) is the
  // image's top-left corner, (1, 1) is its bottom-right corner.
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

  const pass = device.renderPass
  function frame() {
    device.resize()
    if (!shader.isValid) {
      return
    }

    // Assign the texture to the sampler uniform declared in the shader.
    shader.program.set('uTexture', texture)
    shader.program.commit()

    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    pass.setProgram(shader.program)
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
