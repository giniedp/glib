import { glsl, ShaderFxDocument } from '@gglib/graphics'

export const POST_KAWASE_BLOOM: ShaderFxDocument = {
  name: 'bloom kawase',
  program: glsl`
    precision highp float;
    precision highp int;

    // @binding position
    attribute vec3 position;
    // @binding texture
    attribute vec2 texture;
    //
    varying vec2 texCoord;

    // @default 1.0
    uniform float iteration;
    // @default 0.75
    uniform float threshold;
    // @binding texel
    uniform vec2 texel;
    // @binding texture1
    // @register 0
    uniform sampler2D texture1Sampler;
    // @binding texture2
    // @register 1
    uniform sampler2D texture2Sampler;

    vec4 glowCut(in sampler2D texture, in vec2 uv, in float threshold) {
      vec3 color = texture2D(texture, uv).rgb;
      float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      if (lum > threshold) {
        return vec4(color.rgb, 1.0);
      }
      return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 kawaseIteration(in sampler2D texture, in vec2 uv) {
      vec2 texCoord = vec2(0);
      vec2 dUV = (texel * iteration) + texel * 0.5;
      vec4 color = vec4(0);

      // Sample top left pixel
      texCoord.x= uv.x - dUV.x;
      texCoord.y= uv.y + dUV.y;
      color = texture2D(texture, texCoord);

      // Sample top right pixel
      texCoord.x= uv.x + dUV.x;
      texCoord.y= uv.y + dUV.y;
      color += texture2D(texture, texCoord);

      // Sample bottom right pixel
      texCoord.x= uv.x + dUV.x;
      texCoord.y= uv.y - dUV.y;
      color += texture2D(texture, texCoord);

      // Sample bottom left pixel
      texCoord.x= uv.x - dUV.x;
      texCoord.y= uv.y - dUV.y;
      color += texture2D(texture, texCoord);

      // Average
      color *= 0.25;
      color.a = 1.0;
      return color;
    }

    vec4 adjustSaturation(in vec4 color, in float saturation) {
      float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      return vec4(mix(vec3(lum), color.rgb, saturation), color.a);
    }

    vec4 combine(in sampler2D texture1, in sampler2D texture2, in vec2 uv) {
      // Look up the bloom and original base image colors.
      vec4 base = texture2D(texture1, uv);
      vec4 bloom = texture2D(texture2, uv);

      // Adjust color saturation and intensity.
      bloom = adjustSaturation(bloom, 1.0);
      base = adjustSaturation(base, 1.0);

      // Darken down the base image in areas where there is a lot of bloom,
      // to prevent things looking excessively burned-out.
      base *= (1.0 - clamp(bloom, vec4(0), vec4(1)));

      // Combine the two images.
      return base + bloom;
    }
  `,
  technique: [
    {
      name: 'glowCut',
      pass: {
        vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
        fragmentShader: glsl`
        void main() {
          gl_FragColor = glowCut(texture1Sampler, texCoord, threshold);
        }
      `,
      },
    },
    {
      name: 'kawaseIteration',
      pass: {
        vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
        fragmentShader: glsl`
        void main() {
          gl_FragColor = kawaseIteration(texture1Sampler, texCoord);
        }
      `,
      },
    },
    {
      name: 'combine',
      pass: {
        vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
        fragmentShader: glsl`
        void main() {
          gl_FragColor = combine(texture1Sampler, texture2Sampler, texCoord);
        }
      `,
      },
    },
  ],
}
