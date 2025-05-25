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

    varying vec2 uv;

    // @binding texture
    // @filter LinearClamp
    uniform sampler2D textureSampler;

    // @default [0.01, 0.01]
    uniform vec2 texel;
  `,
  technique: {
    name: '',
    pass: {
      vertexShader: glsl`
        void main(void) {
          uv = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        void main() {
          gl_FragColor = vec4(texture2D(textureSampler, texel * floor(uv / texel)).rgb, 1.0);
        }
      `,
    },
  },
}
