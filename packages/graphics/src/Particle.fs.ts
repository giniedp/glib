export default `
precision highp float;
precision highp int;

// @binding texture
// @register 0
// @filter LinearWrap
uniform sampler2D textureSampler;

varying vec2 texCoord;
varying vec4 texColor;

void main(void) {
  gl_FragColor = texture2D(textureSampler, texCoord) * texColor;
}
`
