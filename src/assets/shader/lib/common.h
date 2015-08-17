// @binding world
uniform mat4 worldMat4;
// @binding view
uniform mat4 viewMat4;
// @binding projection
uniform mat4 projMat4;

// @binding ambient
// @widget   color
// @default  [0.2, 0.2, 0.2]
uniform vec3 ambient;

// @binding diffuse
// @widget   color
// @default  [1, 1, 1]
uniform vec3 diffuse;

// @binding specular
// @widget   color
// @default  [1, 1, 1]
uniform vec3 specular;

// @binding alpha
// @widget   range(0, 1)
// @default  1
uniform float alpha;

// @binding specularPower
// @widget   range(0, 255)
// @default  16
uniform float specularPower;

// @register 0
// @filter   LinearWrap
uniform sampler2D diffuseTex;

// @register 1
// @filter   LinearWrap
uniform sampler2D normalTex;
