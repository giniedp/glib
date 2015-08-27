// @binding World
uniform mat4 WorldMat4;
// @binding View
uniform mat4 ViewMat4;
// @binding Projection
uniform mat4 ProjectionMat4;
// @binding ViewProjection
uniform mat4 ViewProjectionMat4;

// @binding CameraDirection
uniform vec3 CameraDirection;
// @binding CameraPosition
uniform vec3 CameraPosition;

// @binding AmbientColor
// @widget   color
// @default  [0.2, 0.2, 0.2]
uniform vec3 AmbientColor;

// @binding DiffuseColor
// @widget   color
// @default  [1, 1, 1]
uniform vec3 DiffuseColor;

// @binding SpecularColor
// @widget   color
// @default  [1, 1, 1]
uniform vec3 SpecularColor;

// @binding Alpha
// @widget   range(0, 1)
// @default  1
uniform float Alpha;

// @binding SpecularPower
// @widget   range(0, 1024)
// @default  16
uniform float SpecularPower;

// @binding DiffuseMap
// @register 0
// @filter   LinearWrap
uniform sampler2D DiffuseMap;

// @binding NormalMap
// @register 1
// @filter   LinearWrap
uniform sampler2D NormalMap;

// @binding SpecularTexture
// @register 1
// @filter   LinearWrap
uniform sampler2D SpecularMap;

// @binding DiffuseMapEnabled
// @default false
uniform bool DiffuseMapEnabled;

// @binding NormalMapEnabled
// @default false
uniform bool NormalMapEnabled;

// @binding SpecularMapEnabled
// @default false
uniform bool SpecularMapEnabled;

struct LightParams {
  vec4 Position;  // xyz, w is unused
  vec4 Direction; // xyz, w is unused
  vec4 Color;     // rgb = diffuse, a = specular amount
  vec4 Misc;      // implementation dependent light attributes
                  // w component is light type
                  // 0 = off, 1 = directional, 2 = point, 3 = spot
};
uniform LightParams Lights[4];

vec4 GetDiffuseColor(in vec2 uv){
  if (DiffuseMapEnabled) {
    return texture2D(DiffuseMap, uv) * vec4(DiffuseColor, Alpha);
  } 
  return vec4(DiffuseColor, Alpha);
}
