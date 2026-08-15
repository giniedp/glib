import { Color, createDevice, Device, PlatformId } from '@gglib/graphics'

export default async function run(canvas: HTMLCanvasElement, _: any, platform: PlatformId) {
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

  // The previous example interleaved position and color into a single
  // buffer. `createVertexBuffer` also accepts an array with more than one
  // entry - one buffer per "stream". Each attribute still needs to be
  // declared with a `vertexLayout`, but the byte offsets are now relative
  // to their own buffer instead of a shared one.
  //
  // This is useful when data changes at different rates (e.g. static
  // positions vs. per-frame colors) or comes from different sources.
  const vertices = device.createVertexBuffer([
    {
      // Stream 0: positions only.
      vertexLayout: {
        vPosition: {
          elementType: 'float32',
          elementCount: 3,
          byteOffset: 0,
        },
      },
      // prettier-ignore
      data: new Float32Array([
        -1, -1, 0.0,
         1, -1, 0.0,
        -1,  1, 0.0,
         1,  1, 0.0,
      ]),
    },
    {
      // Stream 1: colors only, packed as 4 bytes (RGBA) per vertex instead
      // of 3 floats. `normalized: true` tells the GPU to map the 0-255
      // byte range to a 0.0-1.0 float range in the shader. The `cpu` option
      // lets us build the `data` array as `Uint32Array` (one packed 32bit
      // color per vertex) while the GPU still reads it as 4 separate bytes.
      vertexLayout: {
        vColor: {
          elementType: 'uint8',
          elementCount: 4,
          byteOffset: 0,
          normalized: true,
          cpu: {
            elementType: 'uint32',
            elementCount: 1,
          },
        },
      },
      // prettier-ignore
      data: new Uint32Array([
        Color.packToRGBA(Color.Red),
        Color.packToRGBA(Color.Lime),
        Color.packToRGBA(Color.Blue),
        Color.packToRGBA(Color.White),
      ]),
    },
  ])

  const indices = device.createIndexBuffer({
    indexType: 'uint16',
    data: new Uint16Array([0, 2, 1, 1, 2, 3]),
  })

  const pass = device.renderPass
  function frame() {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()
    if (!shader.isValid) {
      return
    }

    pass.setProgram(shader.program)
    // A single call still assigns all streams at once - gglib resolves
    // which physical buffer backs which attribute based on the layouts
    // declared above.
    pass.setVertexBuffer(vertices)
    pass.setIndexBuffer(indices)
    pass.drawIndexed(6)
    pass.flush()
  }

  device.scheduler.add(frame)
  return () => {
    device.dispose()
  }
}

const glslVS = /*glsl*/ `
  #version 300 es
  in vec3 vPosition;
  in vec4 vColor;
  out vec4 vertexColor;
  void main(void) {
    vertexColor = vColor;
    gl_Position = vec4(vPosition, 1.0);
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  in vec4 vertexColor;
  out vec4 fragColor;
  void main(void) {
    fragColor = vertexColor;
  }
`
const wgslShader = /*wgsl*/ `
  struct VertexInput {
    @location(0) vPosition : vec3<f32>,
    @location(1) vColor : vec4<f32>,
  };

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) vertexColor : vec4<f32>,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(input.vPosition, 1.0);
    output.vertexColor = input.vColor;
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return input.vertexColor;
  }
`
