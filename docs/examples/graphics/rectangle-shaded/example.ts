import { CullState, DepthState, createDevice } from '@gglib/graphics'
import { Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'

const vertexShader = /*glsl*/ `
  precision highp float;

  attribute vec3 vPosition;
  attribute vec3 vNormal;
  attribute vec2 vTexture;

  uniform mat4 uWorld;
  uniform mat4 uView;
  uniform mat4 uProjection;

  // data for fragment stage
  varying vec3 normal;
  varying vec3 position;
  varying vec2 texCoord;

  void main(void) {
    vec4 pos = uWorld * vec4(vPosition, 1.0);
    normal = mat3(uWorld) * vNormal;
    position = pos.xyz;
    texCoord = vTexture;
    gl_Position = uProjection * uView * pos;
  }
`

const fragmentShader = /*glsl*/ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec3 uLightColor;
  uniform vec3 uLightDirection;
  uniform vec3 uEyePosition;
  uniform float uSpecularPower;

  // data from vertex stage
  varying vec3 normal;
  varying vec3 position;
  varying vec2 texCoord;

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

  void main(void) {
    vec4 term = CalculateLightTerm(uEyePosition - position, normal, -uLightDirection, uLightColor, uSpecularPower);
    vec4 color = texture2D(uTexture, texCoord);
    color.rgb = uLightColor * term.rgb * color.rgb + term.a * color.rgb;
    color.a = 1.0;
    gl_FragColor = color;
  }
`
export default (canvas: HTMLCanvasElement) => {
  // Create the graphics device and pass the existing canvas element from the DOM.
  const device = createDevice({
    canvas,
  })

  // Create a shader program with vertex and fragment shaders.
  // Here the shader source code is grabbed from the script tags.
  const program = device.createProgram({
    vertexShader,
    fragmentShader,
  })

  // Create the vertex buffer.
  const vertices = device.createVertexBuffer([
    {
      layout: {
        vPosition: { type: 'float', offset: 0, elements: 3 },
        vNormal: { type: 'float', offset: 12, elements: 3 },
        vTexture: { type: 'float', offset: 24, elements: 2 },
      },
      // type: 'ushort',
      // as the layout already indicates, we add a normal data to each vertex
      data: [
        ///   POSITION      NORMAL  TEXTURE
        /// X     Y    Z    X|Y|Z      U  V
        -0.5, -0.5, 0.0, 0, 0, 1, 0, 1, 0.5, -0.5, 0.0, 0, 0, 1, 1, 1, -0.5, 0.5, 0.0, 0, 0, 1, 0, 0, 0.5, 0.5, 0.0, 0,
        0, 1, 1, 0,
      ],
    },
  ])

  // Create the index buffer.
  const indices = device.createIndexBuffer({
    dataType: 'ushort',
    data: [0, 1, 2, 1, 2, 3],
  })

  // Create a texture object.
  // Simply pass an URL to the image that should be used as a texture.
  const texture = device.createTexture({
    source: '/assets/textures/prototype/proto_red.png',
  })

  // Define some variables that will be passed to the shader.
  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const proj = Mat4.createIdentity()
  const camPosition = Vec3.create(0, 0, 1)
  const lightDirection = Vec3.create(0, 0, -1)
  const lightColor = Vec3.create(1, 1, 1)

  function render(time: number) {
    if (!program.isReady) {
      return
    }
    // resize (if needed) and clear the screen
    device.resize()
    device.cullState = CullState.CullNone
    device.depthState = DepthState.Default
    device.clear(0xff2e2620, 1)

    // rotate the rectangle, place the camera
    // and update projection with the aspect ration of the canvas
    world.initRotationY(time! / 1000)
    view.initIdentity().setTranslationV(camPosition).invert()
    proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 10)

    // pass variables to the shader
    program.setUniform('uTexture', texture)
    program.setUniform('uWorld', world)
    program.setUniform('uView', view)
    program.setUniform('uProjection', proj)

    program.setUniform('uLightColor', lightColor)
    program.setUniform('uLightDirection', lightDirection)
    program.setUniform('uEyePosition', camPosition)
    program.setUniform('uSpecularPower', 16)

    // set drawing state
    device.program = program
    device.indexBuffer = indices
    device.vertexBuffer = vertices
    // and render
    device.drawIndexedPrimitives('TriangleList', 0, 6)
  }

  return loop(render).stop
}
