import {
  boxGeometry,
  Color,
  createDevice,
  CullState,
  Device,
  planeGeometry,
  PlatformId,
  TaskContext,
  Texture,
  TextureUsage,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const EFFECTS = { None: 0, Grayscale: 1, Invert: 2, Vignette: 3 }

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const sceneShader = device.createShaderModule({
    wgsl: { source: sceneWgsl },
    glsl: { vertex: sceneGlslVS, fragment: sceneGlslFS },
  })
  const postShader = device.createShaderModule({
    wgsl: { source: postWgsl },
    glsl: { vertex: postGlslVS, fragment: postGlslFS },
  })

  const cube = boxGeometry(device, {
    size: 2,
  })
  const quad = planeGeometry(device, {
    // rotate from XZ plane to XY
    vertexTransform: Mat4.createRotationX(90 * DEGREE_TO_RAD),
    size: 2,
  })

  const settings = { effect: 'Vignette' as keyof typeof EFFECTS }
  mountUi(tools, (ui) => {
    ui.select(settings, 'effect', { options: Object.keys(EFFECTS) })
  })

  const renderTarget: Texture = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    usage: TextureUsage.TextureBinding,
  })

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const cameraPosition = Vec3.create(0, 0.6, 4)

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    renderTarget.resizeToMatch(device.output)

    if (!sceneShader.isValid || !postShader.isValid) {
      return
    }

    world.initIdentity().rotateY((ctx.time / 1000) * 25 * DEGREE_TO_RAD)
    view.initLookAt(cameraPosition, Vec3.create(0, 0, 0), Vec3.create(0, 1, 0)).invert()
    projection.initPerspectiveFieldOfView(60 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    const sceneProgram = sceneShader.program
    sceneProgram.set('uWorld', world)
    sceneProgram.set('uView', view)
    sceneProgram.set('uProjection', projection)
    sceneProgram.commit()

    // --- Pass 1: render the scene normally, into a texture ------------
    pass.setRenderTarget(0, renderTarget)
    pass.setViewportState(0, 0, device.output.width, device.output.height)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setClearDepth(1)
    pass.clear()

    pass.setCullState(CullState.CullBack)
    pass.setProgram(sceneProgram)
    pass.render(cube)

    // --- Pass 2: run a full-screen shader over that image --------------
    const postProgram = postShader.program
    postProgram.set('uTexture', renderTarget)
    postProgram.set('uEffect', EFFECTS[settings.effect])
    postProgram.commit()

    pass.setRenderTarget(0, device.output)
    pass.setClearColor(0, Color.Black)
    pass.clear()

    pass.setProgram(postProgram)
    pass.render(quad)

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
  uniform mat4 uWorld;
  uniform mat4 uView;
  uniform mat4 uProjection;
  out vec3 vertexColor;
  void main(void) {
    vertexColor = vec3(0.5) + position * 0.5;
    gl_Position = uProjection * uView * uWorld * vec4(position, 1.0);
  }
`
const sceneGlslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  in vec3 vertexColor;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(vertexColor, 1.0);
  }
`
const sceneWgsl = /*wgsl*/ `
  @group(0) @binding(0) var<uniform> uWorld : mat4x4f;
  @group(0) @binding(1) var<uniform> uView : mat4x4f;
  @group(0) @binding(2) var<uniform> uProjection : mat4x4f;

  struct VertexInput {
    @location(0) position : vec3f,
  };
  struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) vertexColor : vec3f,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = uProjection * uView * uWorld * vec4f(input.position, 1.0);
    output.vertexColor = input.position * 0.5 + vec3(0.5);
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4f {
    return vec4f(input.vertexColor, 1.0);
  }
`

const postGlslVS = /*glsl*/ `
  #version 300 es
  in vec3 position;
  in vec2 texture;
  out vec2 uv;
  void main(void) {
    uv = vec2(texture.x, 1.0 - texture.y);
    gl_Position = vec4(position, 1.0);
  }
`
// `uEffect` picks the post effect: 0 none, 1 grayscale, 2 invert, 3 vignette.
const postGlslFS = /*glsl*/ `
  #version 300 es
  precision highp float;
  in vec2 uv;
  uniform sampler2D uTexture;
  uniform float uEffect;
  out vec4 fragColor;
  void main(void) {
    vec4 color = texture(uTexture, uv);
    if (uEffect < 0.5) {
      // none
    } else if (uEffect < 1.5) {
      float l = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = vec3(l);
    } else if (uEffect < 2.5) {
      color.rgb = 1.0 - color.rgb;
    } else {
      float d = distance(uv, vec2(0.5));
      color.rgb *= smoothstep(0.75, 0.25, d);
    }
    fragColor = color;
  }
`
const postWgsl = /*wgsl*/ `
  @group(0) @binding(0) var uTexture : texture_2d<f32>;
  @group(0) @binding(1) var uSampler : sampler;
  @group(0) @binding(2) var<uniform> uEffect : f32;

  struct VertexInput {
    @location(0) position : vec3f,
    @location(1) texture : vec2<f32>,
  };
  struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) uv : vec2<f32>,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.uv = input.texture;
    output.Position = vec4f(input.position, 1.0);
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4f {
    var color = textureSample(uTexture, uSampler, input.uv);
    if (uEffect < 0.5) {
      // none
    } else if (uEffect < 1.5) {
      let l = dot(color.rgb, vec3f(0.299, 0.587, 0.114));
      color = vec4f(vec3f(l), color.a);
    } else if (uEffect < 2.5) {
      color = vec4f(1.0 - color.rgb, color.a);
    } else {
      let d = distance(input.uv, vec2<f32>(0.5, 0.5));
      color = vec4f(color.rgb * smoothstep(0.75, 0.25, d), color.a);
    }
    return color;
  }
`
