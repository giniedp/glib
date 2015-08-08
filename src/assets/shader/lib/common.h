// semantic : world
uniform mat4 worldMat4;
// semantic : view
uniform mat4 viewMat4;
// semantic : projection
uniform mat4 projMat4;

// semantic : ambient
// widget   : color
// default  : [0.2, 0.2, 0.2]
uniform vec3 ambient;

// semantic : diffuse
// widget   : color
// default  : [1, 1, 1]
uniform vec3 diffuse;

// semantic : specular
// widget   : color
// default  : [1, 1, 1]
uniform vec3 specular;

// semantic : alpha
// widget   : range(0, 1)
// default  : 1
uniform float alpha;

// semantic : specularPower
// widget   : range(0, 255)
// default  : 16
uniform float specularPower;

// register : 0
// filter   : LinearWrap
uniform sampler2D diffuseTex;

// register : 1
// filter   : LinearWrap
uniform sampler2D normalTex;
