vec4 CalculateLightTerm(
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

void CalculateLightTerms(in vec3 position, in vec3 normal, in float power, out vec3 diffuse, out vec3 specular)
{
  diffuse = vec3(0);
  specular = vec3(0);

  for (int i = 0; i < 4; i++)
  {

    LightParams light = Lights[i];
    int type = int(light.Misc.w);
    
    // stop on first light that is off
    if (type <= 0)
    {
      break;
    }

    float att = 0.0;

    // directional light (no attenuation)
    if (type == 1)
    {
      att = 1.0;
    }
    // point light (radial linear attenuation)
    else if (type == 2)
    {
      // misc.x => light range
      att = 1.0 - min(1.0, distance(light.Position.xyz, position) / max(light.Misc.x, 1.0));
    }
    // spot light (cone and linear attenuation)
    else if (type == 3)
    {
      // misc.x => light range
      // misc.y => cos outer angle
      // misc.z => cos inner angle
      vec3 toLight = light.Position.xyz - position;
      float spot = smoothstep(light.Misc.y, light.Misc.z, dot(normalize(toLight), -light.Direction.xyz));
      att = 1.0 - min(1.0, length(toLight) / max(light.Misc.x, 1.0)) * spot;
    }

    // calculate diffuse and specular terms
    vec4 term = CalculateLightTerm(CameraPosition - position, normal, -light.Direction.xyz, light.Color.rgb, power) * att;
    // accumulate diffuse color
    diffuse += term.rgb;
    
    // accumulate specular color
    specular.rgb += term.rgb * term.a * light.Color.a;
  }
}

highp vec3 EvaluateLights(in vec3 position, in vec3 normal, in vec3 diffuse, in vec3 specular, in float power)
{
  vec3 dTerm = vec3(0);
  vec3 sTerm = vec3(0);
  CalculateLightTerms(position, normal, power, dTerm, sTerm);
  return dTerm * diffuse + sTerm * specular;
}
