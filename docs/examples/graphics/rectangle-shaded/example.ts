import { Color, CullState, DepthState, Device, WebglDevice } from '@gglib/graphics'
import { TaskContext } from '@gglib/graphics/dist/graphics/src/Scheduler'
import { Mat4, Vec3 } from '@gglib/math'

const vertexShader = /*glsl*/ `
  #version 300 es
  precision highp float;

  in vec3 vPosition;
  in vec3 vNormal;
  in vec2 vTexture;

  uniform mat4 uWorld;
  uniform mat4 uView;
  uniform mat4 uProjection;

  // data for fragment stage
  out vec3 normal;
  out vec3 position;
  out vec2 texCoord;

  void main(void) {
    vec4 pos = uWorld * vec4(vPosition, 1.0);
    normal = mat3(uWorld) * vNormal;
    position = pos.xyz;
    texCoord = vTexture;
    gl_Position = uProjection * uView * pos;
  }
`

const fragmentShader = /*glsl*/ `
  #version 300 es
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec3 uLightColor;
  uniform vec3 uLightDirection;
  uniform vec3 uEyePosition;
  uniform float uSpecularSmoothness;

  // data from vertex stage
  in vec3 normal;
  in vec3 position;
  in vec2 texCoord;

  vec4 CalculateLightTerm(
    in vec3 E,   // Vector To Eye
    in vec3 N,   // Surface Normal
    in vec3 L,   // Vector To Light
    in vec3 LC,  // Light Color
    in float SP) // Specular Power
  {
    // diffuse term

    // float NdotL = max(0.0, dot(N, L));
    float NdotL = max(0.0, abs(dot(N, L))); // abs for backface
    vec4 result = vec4(NdotL * LC, 0.0);

    // specular term
    if (NdotL > 0.0)
    {
      vec3 H = normalize(E + L);
      result.a = pow(abs(dot(N, H)), SP);
    }
    return result;
  }

  out vec4 fragColor;
  void main(void) {
    vec4 term = CalculateLightTerm(uEyePosition - position, normal, -uLightDirection, uLightColor, uSpecularSmoothness);
    vec4 color = texture(uTexture, texCoord);
    color.rgb = uLightColor * term.rgb * color.rgb + term.a * color.rgb;
    color.a = 1.0;
    fragColor = color;
  }
`
export default async (canvas: HTMLCanvasElement) => {
  // Create the graphics device and pass the existing canvas element from the DOM.
  const device: Device = await new WebglDevice({ canvas }).ready

  // Create a shader program with vertex and fragment shaders.
  // Here the shader source code is grabbed from the script tags.
  const shader = device.createShaderModule({
    glsl: {
      vertex: vertexShader,
      fragment: fragmentShader,
    },
  })

  // Create the vertex buffer.
  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        vPosition: { elementType: 'float32', byteOffset: 0, elementCount: 3 },
        vNormal: { elementType: 'float32', byteOffset: 12, elementCount: 3 },
        vTexture: { elementType: 'float32', byteOffset: 24, elementCount: 2 },
      },
      // type: 'ushort',
      // as the layout already indicates, we add a normal data to each vertex
      // prettier-ignore
      data: new Float32Array([
        //   POSITION      NORMAL  TEXTURE
        // X     Y    Z    X|Y|Z  U  V
        -0.5, -0.5, 0.0, 0, 0, 1, 0, 1, // Vertex 1
        0.5, -0.5, 0.0, 0, 0, 1, 1, 1, // Vertex 2
        -0.5, 0.5, 0.0, 0, 0, 1, 0, 0, // Vertex 3
        0.5, 0.5, 0.0, 0, 0, 1, 1, 0, // Vertex 4
      ]),
    },
  ])

  // Create the index buffer.
  const indices = device.createIndexBuffer({
    indexType: 'uint16',
    data: new Uint16Array([0, 1, 2, 1, 2, 3]),
  })

  // Create a texture object.
  // Simply pass an URL to the image that should be used as a texture.
  const texture = device.createTexture({
    source: '/textures/prototype/proto_red.png',
  })

  // Define some variables that will be passed to the shader.
  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const proj = Mat4.createIdentity()
  const camPosition = Vec3.create(0, 0, 1)
  const lightDirection = Vec3.create(0, 0, -1)
  const lightColor = Vec3.create(1, 1, 1)

  function frame(ctx: TaskContext) {
    if (!shader.isReady) {
      return
    }
    // resize (if needed) and clear the screen
    device.resize()

    // rotate the rectangle, place the camera
    // and update projection with the aspect ration of the canvas
    world.initRotationY(ctx.time / 1000)
    view.initIdentity().setTranslation(camPosition).invert()
    proj.initPerspectiveFieldOfView(Math.PI / 2, device.output.aspectRatio, 0.1, 10, device.ndcMinZ)
    // pass variables to the shader
    const program = shader.program
    program.set('uTexture', texture)
    program.set('uWorld', world)
    program.set('uView', view)
    program.set('uProjection', proj)

    program.set('uLightColor', lightColor)
    program.set('uLightDirection', lightDirection)
    program.set('uEyePosition', camPosition)
    program.set('uSpecularSmoothness', 16)
    program.commit()

    const pass = device.renderPass
    pass.flush()
    pass.setCullState(CullState.Disabled)
    pass.setDepthState(DepthState.Disabled)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    // set drawing state
    pass.setProgram(program)
    pass.setVertexBuffer(vertices)
    pass.setIndexBuffer(indices)
    // and render
    pass.setPrimitiveType('TriangleList')
    pass.drawIndexed(6)
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
