import { glsl, ShaderFxDocument } from '@gglib/graphics'

export const POST_TONEMAP: ShaderFxDocument = {
  name: 'tonemapping',
  program: glsl`
    precision highp float;
    precision highp int;

    // @binding position
    attribute vec3 position;

    // @binding texture
    attribute vec2 texture;

    varying vec2 texCoord;

    // @binding texture1
    // @register 0
    uniform sampler2D texture1Sampler;
    // @binding texture1Texel
    uniform vec2 texture1Texel;

    // @binding texture2
    // @register 1
    // @filter LinearClamp
    uniform sampler2D texture2Sampler;
    // @binding texture2Texel
    uniform vec2 texture2Texel;

    const vec3 dotLum = vec3(0.2126, 0.7152, 0.0722);

    vec4 extractLuminance(sampler2D texture, vec2 uv, vec2 texel) {
      float average = 0.0;
      float minimum = 1.0;
      float maximum = -1e20;
      vec3 color = vec3(0);
      float lum = 0.0;

      // get color and calculate luminance
      color   = texture2D(texture, uv).rgb;
      lum     = dot(color, dotLum);
      average = average + lum;
      minimum = min(minimum, lum);
      maximum = max(maximum, lum);

      color   = texture2D(texture, uv + texel).rgb;
      lum     = dot(color, dotLum);
      average = average + lum;
      minimum = min(minimum, lum);
      maximum = max(maximum, lum);

      color   = texture2D(texture, uv + vec2(texel.x, 0)).rgb;
      lum     = dot(color, dotLum);
      average = average + lum;
      minimum = min(minimum, lum);
      maximum = max(maximum, lum);

      color   = texture2D(texture, uv + vec2(0, texel.y)).rgb;
      lum     = dot(color, dotLum);
      average = average + lum;
      minimum = min(minimum, lum);
      maximum = max(maximum, lum);

      average *= 0.25;
      return vec4(average, maximum, minimum, 1);
    }

    vec4 downsample(sampler2D texture, vec2 uv, vec2 texel) {
      vec3 luminance = vec3(0);
      vec3 data = vec3(0);

      data = texture2D(texture, uv).rgb;
      luminance.r = luminance.r + data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture, uv + texel).rgb;
      luminance.r = luminance.r + data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture, uv + vec2(texel.x, 0)).rgb;
      luminance.r = luminance.r + data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture, uv + vec2(0, texel.y)).rgb;
      luminance.r = luminance.r + data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      luminance.r *= 0.25;
      return vec4(luminance.rgb, 1);
    }

    vec4 adaptLuminance(sampler2D texture1, sampler2D texture2, vec2 uv, vec2 texel, float speed) {
      vec3 luminance = vec3(0);

      vec4 data = texture2D(texture1, uv);
      luminance.r += data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture1, uv + texel);
      luminance.r += data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture1, uv + vec2(texel.x, 0));
      luminance.r += data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture1, uv + vec2(0, texel.y));
      luminance.r += data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      luminance.r *= 0.25;

      vec3 adaptedLum = texture2D(texture2, vec2(0.5, 0.5)).rgb;
      luminance = adaptedLum + (luminance - adaptedLum) * clamp(speed, 0.0, 1.0);
      return vec4(luminance.rgb, 1.0);
    }

    float mapLuminance(float intensity, float exposure, float avgLum, float black, float white) {
      // Reinhard's tone mapping equation (See Eqn#3 from  "Photographic Tone
      // Reproduction for Digital Images" for more details) is:
      //
      //      (      (   L     ))
      // L  * (1.0f +(---------))
      //      (      ((Lm * Lm)))
      // -------------------------
      //         1.0f + L
      //
      // L is the luminance at the given point, this is computed using Eqn#2
      // from the above paper:
      //
      //        exposure
      //   Lp = -------- * intensity
      //          avg
      //
      // The "exposure" ("key" in the above paper) can be used to adjust the
      // overall "balance" of the image. "avg" is the average luminance across
      // the scene, computed via the luminance downsampling process.
      // "intensity" is the measured brightness of the current pixel
      // being processed.

      float i = intensity - black;
      float Ld = 0.0;
      if (i > 0.0)
      {
          float L = exposure / avgLum * i;
          Ld = L * (1.0 + L / (white * white)) / (1.0 + L);
      }
      return Ld;
    }
  `,
  technique: [
    {
      name: 'Luminance',
      pass: {
        vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
        fragmentShader: glsl`
        void main() {
          gl_FragColor = extractLuminance(texture1Sampler, texCoord, texture1Texel);
        }
      `,
      },
    },
    {
      name: 'Downsample',
      pass: {
        vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
        fragmentShader: glsl`
        void main() {
          gl_FragColor = downsample(texture1Sampler, texCoord, texture1Texel);
        }
      `,
      },
    },
    {
      name: 'Combine',
      pass: {
        vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
        fragmentShader: glsl`
        // @default 0.2
        uniform float adaptSpeed;

        void main() {
          gl_FragColor = adaptLuminance(texture1Sampler, texture2Sampler, texCoord, texture1Texel, adaptSpeed * 0.0001);
        }
      `,
      },
    },
    {
      name: 'Tonemap',
      pass: {
        vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
        fragmentShader: glsl`
        // @default 0.2
        uniform float exposure;
        // @default 0.8
        uniform float whitePoint;
        // @default 0.0
        uniform float blackPoint;

        void main() {
          // current pixel color and global luminance
          vec4 local = texture2D(texture1Sampler, texCoord);
          vec3 global = texture2D(texture2Sampler, vec2(0.5,0.5)).rgb;
          // perform tone mapping
          float luminance = dot(local.rgb, dotLum);
          float Ld = mapLuminance(luminance, exposure, global.r, blackPoint, whitePoint);
          // scale
          if (luminance > 0.0) {
            local.rgb *= Ld / luminance;
          } else {
            local.rgb *= 0.0;
          }
          local.a = 1.0;
          gl_FragColor = local;
        }
      `,
      },
    },
  ],
}
