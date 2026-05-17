import { Color, createDevice, Device } from '@gglib/graphics'

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
  fn vs_main(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(input.vPosition, 1.0);
    output.vertexColor = input.vColor;
    return output;
  }

  @fragment
  fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    return vec4<f32>(input.vertexColor, 1.0);
  }
`
export default async function run(canvas: HTMLCanvasElement, _: any, platform: 'webgl2' | 'webgpu' | 'auto') {
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

  // Create the vertex buffer. In this example each triangle vertex
  // only has a position attribute.
  // The `layout` option describes how the `data` is structured.
  // The vertex shader expects a vertex attribute with the name `vPosition`
  // of type `vec3` which in the end consists of `3` elements of type `float`
  const vertices = device.createVertexBuffer([
    {
      // The `layout` describes that each vertex begins with a `vPosition` attribute
      // which is a `vec3` with 3 elements.
      vertexLayout: {
        vPosition: {
          byteOffset: 0,
          elementCount: 3,
          elementType: 'float32',
          normalized: false,
          packed: false,
        },
        // It is then followed byt a `vColor` attribute which is also a `vec3` with 3 elements
        // but has an offset of 12 bytes from the beginning of the vertex.
        vColor: {
          byteOffset: 12,
          elementCount: 3,
          elementType: 'float32',
          normalized: false,
          packed: false,
        },
      },
      // The `data` is a sequence of floats that matches the `layout` specification.
      // Each 6 floats define a vertex where the first 3 floats are a `vPosition`
      // and the next 3 floats are the `vColor`
      // prettier-ignore
      data: new Float32Array([
        /* position */ -0.5, -0.5, 0.0, /* color */ 1, 0, 0,
        /* position  */ 0.5, -0.5, 0.0, /* color */ 0, 1, 0,
        /* position  */ 0.0, 0.5, 0.0, /* color */ 0, 0, 1,
      ]),
    },
  ])

  function frame() {
    if (!shader.isReady) {
      return
    }
    // If the size of the canvas is controlled by css (as it is on this page)
    // this call will resize the drawing buffer to match the new size of the canvas.
    device.resize()

    // Clear the screen.
    const pass = device.renderPass

    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    // Now render the vertex buffer with the program.
    // The call to `drawPrimitives` instructs to
    // - draw the vertex buffer as a TriangleList
    // - starting at the beginning of the buffer (`0` offset)
    // - and draw only 3 vertices
    pass.setVertexBuffer(vertices)
    pass.setProgram(shader.program)
    pass.draw(3)
    pass.flush()
  }

  // Start a loop function.
  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
