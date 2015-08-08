struct LightSource {
  vec3 position;
  vec3 direction;
  vec4 color; // rgb = diffuse, a = specular amount
  vec4 misc;  // implementation dependent light attributes
  int type;   // 0 = off, 1 = directional, 2 = point, 3 = spot
};
uniform LightSource lights[4];

// semantic : cameraDirection
uniform vec3 cameraDirection;
// semantic : cameraPosition
uniform vec3 cameraPosition;


vec4 computeLightTerm(
  in vec3 E,   // Vector To Eye
  in vec3 N,   // Surface Normal
  in vec3 L,   // Vector To Light
  in vec3 LC,  // Light Color
  in float SP) // Specular Power
{
  // diffuse term
  float  NdotL  = max(0.0, dot(N, L));
  vec4 result = vec4(NdotL * LC, 0.0);

  // specular term
  if (NdotL > 0.0)
  {
    vec3 H = normalize(E + L);
    result.a = pow(abs(dot(N, H)), SP);
  }
  return result;
}

highp vec3 evaluateLights(in vec3 position, in vec3 normal, in vec3 diffuse, in vec3 specular, in float power)
{
  vec3 result = vec3(0, 0, 0);

  for (int i = 0; i < 4; i++)
  {

    LightSource light = lights[i];

    // stop on first light that is off
    if (light.type <= 0){
      break;
    }

    float att = 0.0;

    // directional light (no attenuation)
    if (light.type == 1)
    {
      //return vec3(1.0, 0.0, 0.0);
      att = 1.0;
    }
    // point light (radial linear attenuation)
    else if (light.type == 2)
    {
      // misc.x => light range
      att = 1.0 - min(1.0, distance(light.position, position) / max(light.misc.x, 1.0));
    }
    // spot light (cone and linear attenuation)
    else if (light.type == 3)
    {
      // misc.x => light range
      // misc.y => cos outer angle
      // misc.z => cos inner angle
      vec3 toLight = light.position - position;
      float spot = smoothstep(light.misc.y, light.misc.z, dot(normalize(toLight), -light.direction));
      att = 1.0 - min(1.0, length(toLight) / max(light.misc.x, 1.0)) * spot;
    }

    // calculate diffuse and specular terms
    vec4 term = computeLightTerm(cameraPosition - position, normal, -light.direction, light.color.rgb, power) * att;
    // accumulate diffuse color
    result.rgb += diffuse.rgb * term.rgb;

    // accumulate specular color
    result.rgb += specular.rgb * term.rgb * term.a * light.color.a;
  }

  return result;
}
