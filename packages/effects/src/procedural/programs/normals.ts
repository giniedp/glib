import { proceduralProgram } from './base';
import { glsl } from '@gglib/graphics';

export function normalsFromHeightProgram() {
  return proceduralProgram({}, [{
    uniforms: glsl`
      // @binding texture
      uniform sampler2D inputTexture;
      // @binding texel
      uniform vec2 texel;
      // @binding strength 1.0
      uniform vec2 strength;
    `,
    fs_main_color: glsl`
      float tl = texture2D(inputTexture, vec2(texCoord.x - texel.x, texCoord.y + texel.y)).r;
      float cl = texture2D(inputTexture, vec2(texCoord.x - texel.x, texCoord.y 		      )).r;
      float bl = texture2D(inputTexture, vec2(texCoord.x - texel.x, texCoord.y - texel.y)).r;
      float t  = texture2D(inputTexture, vec2(texCoord.x          , texCoord.y + texel.y)).r;
      float c  = texture2D(inputTexture, vec2(texCoord.x          , texCoord.y 		      )).r;
      float b  = texture2D(inputTexture, vec2(texCoord.x          , texCoord.y - texel.y)).r;
      float tr = texture2D(inputTexture, vec2(texCoord.x + texel.x, texCoord.y + texel.y)).r;
      float cr = texture2D(inputTexture, vec2(texCoord.x + texel.x, texCoord.y 		      )).r;
      float br = texture2D(inputTexture, vec2(texCoord.x + texel.x, texCoord.y - texel.y)).r;

      float e = 162.0;
      float c = 47.0;
      float dx = tl * c + l * e + bl * c - tr * c - r * e - br * c;
      float dy = tl * c + t * e + tr * c - bl * c - b * e - br * c;
      vec3 normal = normalize(vec3(dx, dy, strength));
      gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
    `,
  }])
}
