import { Color, createDevice, Device } from '@gglib/graphics'
import { loop } from '@gglib/utils'

export default async function run(canvas: HTMLCanvasElement, _: any, platform: 'webgl2' | 'webgpu' | 'auto') {
  // Create the graphics device and pass the existing canvas element from the DOM.
  const device: Device = await createDevice({ canvas, platform }).ready

  // Create a shader program with vertex and fragment shaders.
  // Here the shader source code is grabbed from the script tags.
  const shader = device.createShaderModule({
    wgsl: wgslShader,
    glsl: {
      vertex: glslVS,
      fragment: glslFS,
    },
  })

  // Create an array of vertex buffers. This time each channel is extracted into
  // its own vertex buffer.
  const vertices = device.createVertexBuffer([
    {
      vertexLayout: { vPosition: { elementType: 'float32', byteOffset: 0, elementCount: 3 } },
      // prettier-ignore
      data: new Float32Array([
        -1, -1, 0.0,
         1, -1, 0.0,
        -1,  1, 0.0,
         1,  1, 0.0,
      ]),
    },
    {
      vertexLayout: { vColor: { elementType: 'uint8', byteOffset: 0, elementCount: 4, normalized: true } },
      // prettier-ignore
      data: new Uint32Array([
        Color.packToRGBA(Color.Red),
        Color.packToRGBA(Color.Lime),
        Color.packToRGBA(Color.Blue),
        Color.packToRGBA(Color.White),
      ]),
    },
  ])

  // Create the index buffer.
  const indices = device.createIndexBuffer({
    indexType: 'uint16',
    data: new Uint16Array([0, 2, 1, 1, 2, 3]),
  })

  function frame() {
    // resize (if needed) and clear the screen
    device.resize()
    if (!shader.isReady) {
      return
    }
    const pass = device.renderPass

    pass.flush()
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    // set the drawing state
    pass.setProgram(shader.program)
    pass.setVertexBuffer(vertices)
    pass.setIndexBuffer(indices)
    // and render.
    pass.drawIndexed(6, 1)
    pass.submit()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

const glslVS = /*glsl*/ `
  precision highp float;
  // vertex position attribute
  attribute vec3 vPosition;
  // vertex color attribute
  attribute vec3 vColor;
  // color attribute that will be passed to the fragment shader
  varying vec3 vertexColor;
  void main(void) {
    vertexColor = vColor;
    gl_Position = vec4(vPosition, 1.0);
  }
`

const glslFS = /*glsl*/ `
  precision highp float;
  // color attribute coming from vertex shader
  varying vec3 vertexColor;
  void main(void) {
    // output pixel color
    gl_FragColor = vec4(vertexColor.rgb, 1.0);
  }
`
const wgslShader = /*wgsl*/ `
  struct VertexInput {
    @location(0) vPosition : vec3<f32>,
    @location(1) vColor : vec3<f32>,
  };

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) vertexColor : vec3<f32>,
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
    return vec4<f32>(input.vertexColor, 1.0);
  }
`
