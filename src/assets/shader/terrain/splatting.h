// register : 3
// filter   : LinearWrap
uniform sampler2D textureSplat;

// register : 4
// filter   : LinearWrap
uniform sampler2D textureDiffuse;

// register : 5
// filter   : LinearWrap
uniform sampler2D textureDiffuseR;

// register : 6
// filter   : LinearWrap
uniform sampler2D textureDiffuseG;

// register : 7
// filter   : LinearWrap
uniform sampler2D textureDiffuseB;

// register : 8
// filter   : LinearWrap
uniform sampler2D textureDiffuseA;

// register : 9
// filter   : LinearWrap
uniform sampler2D textureDiffuseSlope;


// register : 10
// filter   : LinearWrap
uniform sampler2D textureNormal;

// register : 11
// filter   : LinearWrap
uniform sampler2D textureNormalR;

// register : 12
// filter   : LinearWrap
uniform sampler2D textureNormalG;

// register : 13
// filter   : LinearWrap
uniform sampler2D textureNormalB;

// register : 14
// filter   : LinearWrap
uniform sampler2D textureNormalA;

// register : 15
// filter   : LinearWrap
uniform sampler2D textureNormalSlope;

//-----------------------------------------------------------------------------
// Calculate the transition factor to blend between clipmaps
//-----------------------------------------------------------------------------
// float BlendClipmaps(vec2 position) {
//   float fac =  N * G;
//   float fac2 = fac / 12.0;
//   vec2 dist = abs(position - ClipCenter.xz);
//   vec2 term = dist - ((fac - G) / 2 - fac2 - 2 * G);
//   term /= fac2;
//
// 	float result = max(term.x, term.y);
// 	return clamp(result, 0, 1);
// }

float BlendSlope(in float slope, in vec2 uv){
  float blend = texture2D(textureDiffuseSlope, uv).r;

  if(slope < 0.5){
    blend = 2.0 * slope * blend;
  } else {
    blend = 1.0 - 2.0 * (1.0 - slope) * (1.0 - blend);
  }
  //blend = mix(slope, blend, SlopeOpacity);
  return clamp((blend - 0.5) * 5.0 + 0.5, 0.0, 1.0);
}

vec4 splatColor(in vec4 uv, in vec4 splat, in float slope){
	vec4 tempColor = vec4(0.0, 0.0, 0.0, 0.0);
	vec2 uv0 = uv.xy;
	vec2 uv1 = uv.xy * 0.25;
	const float brightness = 1.0;//1.5;
	const float saturatuion = 1.0;

	tempColor = texture2D(textureDiffuse, uv0) * brightness;
	//tempColor = AdjustSaturation(tempColor, saturatuion);
	//tempColor *= texture2D(textureDiffuse, uv1) * brightness;

	vec4 color = tempColor;

	tempColor = texture2D(textureDiffuseR, uv0) * brightness;
	//tempColor = AdjustSaturation(tempColor, saturatuion);
	//tempColor *= texture2D(textureDiffuseR, uv1) * brightness;
	color = mix(color.rgba, tempColor, splat.r);

	tempColor = texture2D(textureDiffuseG, uv0) * brightness;
	//tempColor = AdjustSaturation(tempColor, saturatuion);
	//tempColor *= texture2D(textureDiffuseG, uv1) * brightness;
	color = mix(color.rgba, tempColor, splat.g);

	tempColor = texture2D(textureDiffuseB, uv0) * brightness;
	//tempColor = AdjustSaturation(tempColor, saturatuion);
	//tempColor *= texture2D(textureDiffuseB, uv1) * brightness;
	color = mix(color.rgba, tempColor, splat.b);

	// tempColor = texture2D(textureDiffuseA, uv0) * brightness;
	// //tempColor = AdjustSaturation(tempColor, saturatuion);
	// tempColor *= texture2D(textureDiffuseA, uv1) * brightness;
	// color = mix(color.rgba, tempColor, splat.a);

  tempColor = texture2D(textureDiffuseSlope, uv.xy) * brightness;
	color = mix(color.rgba, tempColor, slope);
	//color *= texture2D(textureDiffuseTint, uv.zw);

	return color;
}

vec3 splatNormal(in vec4 uv, in vec4 splat, in float slope){
	vec4 normal = texture2D(textureNormal, uv.xy);
	normal = mix(normal, texture2D(textureNormalR, uv.xy), splat.r);
	normal = mix(normal, texture2D(textureNormalG, uv.xy), splat.g);
	normal = mix(normal, texture2D(textureNormalB, uv.xy), splat.b);
	//normal = mix(normal, texture2D(textureNormalA, uv.xy), splat.a);
	normal = mix(normal, texture2D(textureNormalSlope, uv.xy), slope);
	return normalize(normal.xzy * 2.0 - 1.0);
}
