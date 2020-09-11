import { ShaderFxDocument, glsl } from '@gglib/graphics'

export const POST_PIXELATE: ShaderFxDocument = {
  name: 'Pixelate',
  program: glsl`
    precision highp float;
    precision highp int;

    // @binding position
    attribute vec3 position;

    // @binding texture
    attribute vec2 texture;

    // @binding texture
    uniform sampler2D textureSampler;

    // @binding targetWidth
    uniform float targetWidth;

    // @binding targetHeight
    uniform float targetHeight;

    varying vec2 texCoord;

    // @default 0
    uniform float vOffset;

    // @default 4
    uniform float pixelWidth;

    // @default 4
    uniform float pixelHeight;
  `,
  technique: {
    name: '',
    pass: {
      vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        void main() {
          vec2 uv = texCoord;
          if (uv.x >= vOffset) {
            float dx = pixelWidth / targetWidth;
            float dy = pixelHeight / targetHeight;
            uv = vec2(dx * floor(uv.x / dx), dy * floor(uv.y / dy));
          }
          gl_FragColor = vec4(texture2D(textureSampler, uv).rgb, 1);
        }
      `,
    },
  },
}
