import { glsl, ShaderFxDocument } from '@gglib/graphics'

export const POST_KAWASE_STREAKS: ShaderFxDocument = {
  name: 'bloom kawase',
  program: glsl`
    precision highp float;
    precision highp int;

    #define NUM_SAMPLES 4.0

    // @binding position
    attribute vec3 position;
    // @binding texture
    attribute vec2 texture;
    //
    varying vec2 texCoord;

    // @default 1.0
    uniform float iteration;
    // @default 0.9
    uniform float attenuation;
    // @default 0.75
    uniform float threshold;
    // @default 1.0
    uniform float strength;
    // @binding texel
    uniform vec2 texel;
    // @binding texture1
    // @register 0
    // @filter LinearClamp
    uniform sampler2D texture1Sampler;
    // @binding texture2
    // @register 1
    // @filter LinearClamp
    uniform sampler2D texture2Sampler;

    vec4 glowCut(in sampler2D texture, in vec2 uv, in float threshold) {
      vec3 color = texture2D(texture, uv).rgb;
      float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      if (lum > threshold) {
        return vec4(color.rgb, 1.0);
      }
      return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec3 streakFilter(
      in sampler2D texture,
      in vec2 texCoord,
      in vec2 pxSize,
      in vec2 dir,
      float attenuation,
      float pass
    ) {
      vec2 sampleCoord = vec2(0.0);
      vec3 color = vec3(0.0);

      // sample weight = a^(b*s)
      // a = attenuation
      // b = 4^(pass-1)
      // s = sample number
      float b = pow(float(NUM_SAMPLES), pass);
      for (int s = 0; s < int(NUM_SAMPLES); s++) {
        float weight = pow(attenuation, b * float(s));
        // dir = per-pixel, 2D orientation vector
        sampleCoord = texCoord + (normalize(dir) * b * vec2(s,s) * pxSize);
        color += clamp(weight, 0.0, 1.0) * texture2D(texture, sampleCoord).rgb;
      }
      return clamp(color, 0.0, 1.0);
    }

    vec4 kawaseIteration(in sampler2D texture, in vec2 uv) {
      vec4 color = vec4(0);
      color.rgb += streakFilter(texture, uv, texel, vec2(-1.0,  1.0), attenuation, iteration);
      color.rgb += streakFilter(texture, uv, texel, vec2( 1.0,  1.0), attenuation, iteration);
      color.rgb += streakFilter(texture, uv, texel, vec2(-1.0, -1.0), attenuation, iteration);
      color.rgb += streakFilter(texture, uv, texel, vec2( 1.0, -1.0), attenuation, iteration);

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
      vec4 base = texture2D(texture1, uv);
      vec4 bloom = texture2D(texture2, uv) * strength;
      bloom = adjustSaturation(bloom, 1.0);
      base = adjustSaturation(base, 1.0);
      base *= (1.0 - clamp(bloom, vec4(0), vec4(1)));
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
