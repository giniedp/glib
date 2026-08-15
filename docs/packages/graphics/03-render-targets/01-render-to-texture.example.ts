import {
  boxGeometry,
  Color,
  createDevice,
  CullState,
  Device,
  PlatformId,
  TaskContext,
  Texture,
  TextureUsage,
  torusGeometry,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, MS_TO_SEC, Vec3, vec4 } from '@gglib/math'

export default async function run(canvas: HTMLCanvasElement, _: any, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform }).ready

  const sceneShader = device.createShaderModule({
    wgsl: { source: sceneWgsl },
    glsl: { vertex: sceneGlslVS, fragment: sceneGlslFS },
  })
  const presentShader = device.createShaderModule({
    wgsl: { source: presentWgsl },
    glsl: { vertex: presentGlslVS, fragment: presentGlslFS },
  })

  // A fixed-size color + depth target the cube gets rendered into, instead
  // of the canvas. Its size has nothing to do with the canvas size - this
  // one stays 256x256 no matter how the page is resized.
  const sceneSize = 256
  const sceneTarget: Texture = device.createRenderTarget({
    width: sceneSize,
    height: sceneSize,
    format: device.output.format,
    // A render target is a write-only render buffer by default. Since
    // this one is sampled again in the second pass below, it also needs
    // the `Sampled` usage flag.
    usage: TextureUsage.TextureBinding,
  })

  const cube = boxGeometry(device, { size: 2 })
  const torus = torusGeometry(device)

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const cameraPosition = Vec3.create(0, 0, 4)

  const pass = device.renderPass
  const color = vec4(1)
  function frame(ctx: TaskContext) {
    device.resize()

    if (!sceneShader.isValid || !presentShader.isValid) {
      return
    }

    // Pass 1: render the cube into scene render target
    world.initRotationX(ctx.time * MS_TO_SEC * 25 * DEGREE_TO_RAD).scaleUniform(2 + Math.sin(ctx.time * MS_TO_SEC))
    view.initLookAt(cameraPosition, Vec3.create(0, 0, 0), Vec3.create(0, 1, 0)).invert()
    projection.initPerspectiveFieldOfView(60 * DEGREE_TO_RAD, 1, 0.1, 100, device.ndcMinZ)

    const sceneProgram = sceneShader.program
    sceneProgram.set('uWorld', world)
    sceneProgram.set('uView', view)
    sceneProgram.set('uProjection', projection)
    sceneProgram.commit()

    const hue = (ctx.time / 1000) % (Math.PI * 2)
    color.x = 0.5 + 0.5 * Math.sin(hue)
    color.y = 0.5 + 0.5 * Math.sin(hue + 2)
    color.z = 0.5 + 0.5 * Math.sin(hue + 4)

    pass.setRenderTarget(0, sceneTarget)
    pass.setViewportState(0, 0, sceneTarget.width, sceneTarget.height)
    pass.setClearColor(0, color)
    pass.clear()

    pass.setCullState(CullState.CullBack)
    pass.setProgram(sceneProgram)
    torus.render(pass)

    // Pass 2: draw a quad on the canvas, textured with the result
    world.initRotationY((ctx.time / 1000) * 25 * DEGREE_TO_RAD)
    const presentProgram = presentShader.program
    presentProgram.set('uWorld', world)
    presentProgram.set('uView', view)
    presentProgram.set('uProjection', projection)
    presentProgram.set('uTexture', sceneTarget)
    presentProgram.commit()

    pass.setRenderTarget(0, device.output)
    pass.setViewportState(0, 0, device.output.width, device.output.height)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    pass.setCullState(CullState.CullBack)
    pass.setProgram(presentProgram)
    cube.render(pass)

    pass.submit()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

const sceneGlslVS = /*glsl*/ `
  #version 300 es
  in vec3 position;
  out vec4 color;
  uniform mat4 uWorld;
  uniform mat4 uView;
  uniform mat4 uProjection;

  void main(void) {
    gl_Position = uProjection * uView * uWorld * vec4(position, 1.0);
    color = vec4(position * 0.5 + 0.5, 1.0f);
  }
`
const sceneGlslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;

  in vec4 color;
  out vec4 fragColor;
  void main(void) {
    fragColor = color;
  }
`
const sceneWgsl = /*wgsl*/ `
  @group(0) @binding(0) var<uniform> uWorld : mat4x4<f32>;
  @group(0) @binding(1) var<uniform> uView : mat4x4<f32>;
  @group(0) @binding(2) var<uniform> uProjection : mat4x4<f32>;

  struct VertexInput {
    @location(0) position : vec3<f32>,
  };
  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec4<f32>,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = uProjection * uView * uWorld * vec4<f32>(input.position, 1.0);
    output.Color = vec4f(input.position.xyz * 0.5 + vec3f(0.5), 1.0);
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return input.Color;
  }
`

const presentGlslVS = /*glsl*/ `
  #version 300 es
  in vec3 position;
  in vec2 texture;
  out vec2 uv;

  uniform mat4 uWorld;
  uniform mat4 uView;
  uniform mat4 uProjection;

  void main(void) {
    uv = vec2(texture.x, 1.0 - texture.y);
    gl_Position = uProjection * uView * uWorld * vec4(position, 1.0);
  }
`
const presentGlslFS = /*glsl*/ `
  #version 300 es
  precision highp float;
  in vec2 uv;
  uniform sampler2D uTexture;
  out vec4 fragColor;
  void main(void) {
    fragColor = texture(uTexture, uv);
  }
`
const presentWgsl = /*wgsl*/ `
  @group(0) @binding(0) var uTexture : texture_2d<f32>;
  @group(0) @binding(1) var uSampler : sampler;

  @group(1) @binding(0) var<uniform> uWorld : mat4x4<f32>;
  @group(1) @binding(1) var<uniform> uView : mat4x4<f32>;
  @group(1) @binding(2) var<uniform> uProjection : mat4x4<f32>;

  struct VertexInput {
    @location(0) position : vec3<f32>,
    @location(1) texture : vec2<f32>,
  };
  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) uv : vec2<f32>,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.uv = input.texture;
     output.Position = uProjection * uView * uWorld * vec4<f32>(input.position, 1.0);
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return textureSample(uTexture, uSampler, input.uv);
  }
`
