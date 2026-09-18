import {
  Color,
  createDevice,
  CullState,
  DepthState,
  Device,
  PlatformId,
  FrameContext,
  boxGeometry,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'

export default async (canvas: HTMLCanvasElement, _: any, platform: PlatformId) => {
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

  // A cube texture stores 6 images, one per face. `type: 'TextureCube'`
  // tells `createTexture` to expect exactly that: an array of 6 sources,
  // in the fixed order +X, -X, +Y, -Y, +Z, -Z.
  const texture = device.createTexture({
    type: 'TextureCube',
    source: [
      '/textures/cubemaps/dust_right.jpg', // +X right
      '/textures/cubemaps/dust_left.jpg', // -X left
      '/textures/cubemaps/dust_up.jpg', // +Y up
      '/textures/cubemaps/dust_down.jpg', // -Y down
      '/textures/cubemaps/dust_front.jpg', // +Z front
      '/textures/cubemaps/dust_back.jpg', // -Z back
    ],
  })

  const cube = boxGeometry(device)

  const depthTarget = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
    sampleCount: 4,
  })
  const renderTarget = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const cameraPosition = Vec3.create(0, 0, 3)

  const pass = device.renderPass
  function frame(ctx: FrameContext) {
    device.resize()
    depthTarget.resizeToMatch(device.output)

    const t = ctx.time
    cameraPosition.y = Math.sin((t * Math.PI * 2) / 5)
    world.initIdentity().rotateY(t * 20 * DEGREE_TO_RAD)
    view.initTranslation(cameraPosition).invert()
    projection.initPerspectiveFieldOfView(60 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    pass.setRenderTarget(0, renderTarget, 0, 0, device.output)
    pass.setDepthTarget(depthTarget)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setClearDepth(1)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    const program = shader.program
    program.set('uWorld', world)
    program.set('uView', view)
    program.set('uProjection', projection)
    program.set('uTexture', texture)
    program.commit()

    pass.setDepthState(DepthState.LessEqual)
    pass.setCullState(CullState.CullBack)
    pass.setProgram(program)
    cube.render(pass)
    pass.submit()
    pass.resolve()
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}

const glslVS = /*glsl*/ `
  #version 300 es
  in vec3 vPosition;
  uniform mat4 uWorld;
  uniform mat4 uView;
  uniform mat4 uProjection;
  out vec3 direction;
  void main(void) {
    direction = vPosition;
    gl_Position = uProjection * uView * uWorld * vec4(vPosition, 1.0);
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision highp float;
  in vec3 direction;
  uniform samplerCube uTexture;
  out vec4 fragColor;
  void main(void) {
    fragColor = texture(uTexture, normalize(direction));
  }
`

const wgslShader = /*wgsl*/ `
  @group(0) @binding(0) var<uniform> uWorld : mat4x4<f32>;
  @group(0) @binding(1) var<uniform> uView : mat4x4<f32>;
  @group(0) @binding(2) var<uniform> uProjection : mat4x4<f32>;
  @group(0) @binding(3) var uTexture : texture_cube<f32>;
  @group(0) @binding(4) var uSampler : sampler;

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) direction : vec3f,
  };

  @vertex
  fn vs(
    @location(0) position : vec3f,
    @location(1) normal : vec3f
  ) -> VertexOutput {
    var output : VertexOutput;
    output.direction = position;
    output.Position = uProjection * uView * uWorld * vec4<f32>(position, 1.0);
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return textureSample(uTexture, uSampler, normalize(input.direction));
  }
`
