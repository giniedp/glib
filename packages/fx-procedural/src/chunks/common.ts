import { glsl, ShaderChunkSet } from '@gglib/graphics'

export const CHUNK_COMMON: ShaderChunkSet = Object.freeze({
  attributes: glsl`
    // @binding position
    attribute vec3 position;
    // @binding texture
    attribute vec2 texture;
  `,
  varyings: glsl`
    varying vec2 texCoord;
  `,
  uniforms: glsl`
    uniform float time;
    // @default 1
    uniform float aspect;
  `,
  vs_main: glsl`
    texCoord = texture;
    gl_Position = vec4(position, 1.0);
  `,
  fs_main_init_before: glsl`
    vec4 point = vec4(texCoord.x * aspect, texCoord.y, time, 1.0);
    float sample;
    vec4 color;
  `,
  fs_main_color_before: glsl`
    color.rgb = vec3(sample);
    color.a = 1.0;
  `,
  fs_main_complete_after: glsl`
    gl_FragColor = color;
  `,
})
