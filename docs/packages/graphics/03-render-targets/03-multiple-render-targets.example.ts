import {
  boxGeometry,
  Color,
  createDevice,
  CullState,
  DepthState,
  Device,
  PlatformId,
  SpriteBatch,
  TaskContext,
  Texture,
  TextureUsage,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, vec3, Vec3 } from '@gglib/math'

export default async function run(canvas: HTMLCanvasElement, _: any, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const sceneShader = device.createShaderModule({
    wgsl: { source: sceneWgsl },
    glsl: { vertex: sceneGlslVS, fragment: sceneGlslFS },
  })
  const spriteBatch = new SpriteBatch(device)
  const box = boxGeometry(device, { size: 2 })

  // Two color targets, written by the same draw calls in the same pass -
  // `outColor` in the shader below always lands in the first, `outBright`
  // always in the second.
  const colorTarget: Texture = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'RGBA8_UNORM',
    usage: TextureUsage.TextureBinding,
  })
  const normalTarget: Texture = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'RGBA8_UNORM',
    usage: TextureUsage.TextureBinding,
  })
  const depthTarget: Texture = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
  })

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const cameraPosition = Vec3.create(0, 0.75, 4)

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    colorTarget.resizeToMatch(device.output)
    normalTarget.resizeToMatch(device.output)
    depthTarget.resizeToMatch(device.output)

    if (!sceneShader.isValid || !spriteBatch.shader.isValid) {
      return
    }

    world.initIdentity().rotateY((ctx.time / 1000) * 30 * DEGREE_TO_RAD)
    view.initLookAt(cameraPosition, Vec3.create(0, 0, 0), Vec3.create(0, 1, 0)).invert()
    projection.initPerspectiveFieldOfView(45 * DEGREE_TO_RAD, 1, 0.1, 100, device.ndcMinZ)

    const sceneProgram = sceneShader.program
    sceneProgram.set('uWorld', world)
    sceneProgram.set('uView', view)
    sceneProgram.set('uProjection', projection)
    sceneProgram.commit()

    // Pass 1: one draw call, two output images
    pass.setRenderTarget(0, colorTarget)
    pass.setRenderTarget(1, normalTarget)
    pass.setDepthTarget(depthTarget)
    pass.setViewportState(0, 0, colorTarget.width, colorTarget.height)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setClearColor(1, Color.Black)
    pass.setClearDepth(1)
    pass.clear()

    pass.setDepthState(DepthState.LessEqual)
    pass.setCullState(CullState.CullBack)
    pass.setProgram(sceneProgram)
    pass.render(box)

    // Pass 2: show both results side by side on the canvas
    // since we didn't flush() after first pass, we need to undo some settings
    pass.setProgram(null!) //                 undo program
    pass.setRenderTarget(0, device.output) //
    pass.setRenderTarget(1, null) //          undo rt2
    pass.setDepthTarget(null!) //             undo Depth
    pass.setViewportState(0, 0, device.output.width, device.output.height)
    pass.setClearColor(0, Color.Black)
    pass.clear()

    pass.setDepthState(DepthState.Disabled)
    pass.setCullState(CullState.Disabled)

    spriteBatch.begin()
    spriteBatch
      .next(colorTarget)
      .destination(0, 0, device.output.width / 2, device.output.height)
      .flipY(device.isWebGL2)
    spriteBatch
      .next(normalTarget)
      .destination(device.output.width / 2, 0, device.output.width / 2, device.output.height)
      .flipY(device.isWebGL2)

    spriteBatch.render(pass)

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
  in vec3 normal;
  uniform mat4 uWorld;
  uniform mat4 uView;
  uniform mat4 uProjection;
  out vec3 vertexNormal;
  out vec3 vertexColor;
  void main(void) {
    vertexNormal = normal;
    vertexColor = vec3(0.5) + position;
    gl_Position = uProjection * uView * uWorld * vec4(position, 1.0);
  }
`
const sceneGlslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  in vec3 vertexNormal;
  in vec3 vertexColor;
  layout(location = 0) out vec4 outColor;
  layout(location = 1) out vec4 outNormal;
  void main(void) {
    outColor = vec4(vertexColor, 1.0);
    outNormal = vec4(vertexNormal * 0.5 + 0.5, 1.0);
  }
`
const sceneWgsl = /*wgsl*/ `
  @group(0) @binding(0) var<uniform> uWorld : mat4x4<f32>;
  @group(0) @binding(1) var<uniform> uView : mat4x4<f32>;
  @group(0) @binding(2) var<uniform> uProjection : mat4x4<f32>;

  struct VertexInput {
    @location(0) position : vec3<f32>,
    @location(1) normal : vec3<f32>,
  };
  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) vertexColor : vec3<f32>,
    @location(1) vertexNormal : vec3<f32>,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = uProjection * uView * uWorld * vec4<f32>(input.position, 1.0);
    output.vertexColor = input.position * 0.5 + vec3f(0.5);
    output.vertexNormal = input.normal;
    return output;
  }

  struct FragmentOutput {
    @location(0) outColor : vec4<f32>,
    @location(1) outNormal : vec4<f32>,
  };

  @fragment
  fn fs(input: VertexOutput) -> FragmentOutput {
    var output : FragmentOutput;
    output.outColor = vec4<f32>(input.vertexColor, 1.0);
    output.outNormal = vec4<f32>(vec3f(0.5) + input.vertexNormal * 0.5, 1.0);
    return output;
  }
`
