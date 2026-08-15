export const SKYBOX_GLSL_VS: string = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  // @block view
  layout(std140) uniform View {
    mat4 viewProjectionMatrix;
  } view;

  // @block object
  layout(std140) uniform Object {
    mat4 modelMatrix;
  } object;

  // @alias position
  in vec3 aPosition;
  out vec3 uv;

  void main() {

    mat4 rot = object.modelMatrix;
    rot[3] = vec4(0.0, 0.0, 0.0, 0.1);
    uv = (rot * vec4(aPosition, 1.0)).xyz;

    mat4 mat = view.viewProjectionMatrix;
    mat[3] = vec4(0.0, 0.0, 0.0, 0.1);
    vec4 pos = mat * vec4(aPosition, 1.0);

    gl_Position = pos.xyww;
  }
`

export const SKYBOX_GLSL_FS: string = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  // @block material
  layout(std140) uniform Material {
    float intensity;
    float blur;
    int mipCount;
  } material;

  // @block material
  // @alias environmentMap
  uniform samplerCube environmentMapSampler;

  out vec4 fragColor;

  in vec3 uv;

  void main() {
    vec4 color = textureLod(environmentMapSampler, uv, material.blur * float(material.mipCount - 1));
    fragColor = vec4(color.rgb * material.intensity, 1.0);
  }
`
