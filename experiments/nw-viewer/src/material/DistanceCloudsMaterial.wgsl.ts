import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `

const LOCAL_WEATHER : bool = true;
const NUM_SAMPLES : i32 = 32;

struct MaterialBlock {

  alphaMultiplier               : f32, // default 1.0
  alphaSaturation               : f32, // default 2.0
  attenuation                   : f32, // default 0.6
  cloudHeight                   : f32, // default 0.3
  densitySky                    : f32, // default 4.5
  densitySun                    : f32, // default 1.5
  fadingNoiseOffset             : f32, // default 0.0
  fadingNoiseTilingSize         : f32, // default 1000.0
  horizonBendingHeight          : f32, // default 0.2
  skyHeight                     : f32, // default 1000.0
  exposure                      : f32, // default 1.0
  maxShadowDensity              : f32, // default 1.0
  minShadowDensity              : f32, // default 0.0
  opacity                       : f32, // default 1.0
  shadowFadingInclinationFactor : f32, // default 10
  shadowFadingRadiusFactor      : f32, // default 10
  shadowPower                   : f32, // default 1.0
  shadowSkydomeSize             : f32, // default 1000.0
  skyColorMultiplier            : f32, // default 1.5
  spriteSheetColumns            : f32, // default 1.0
  spriteSheetDuration           : f32, // default 1.0
  spriteSheetNumFrames          : f32, // default 1.0
  spriteSheetRows               : f32, // default 1.0
  stepSize                      : f32, // default 0.004
  sunColorMultiplier            : f32, // default 4.0
  weatherRadius                 : f32, // default 2500.0
  weatherSmoothRadius           : f32, // default -1500.0

  // -- Texture modifier matrices
  uvModDiffuse                   : mat4x4f,
  enabledUvModDiffuse            : u32,     // _ModifyUV_1
};

@group(0) @binding(0) var<uniform> global  : GlobalBlock;
@group(0) @binding(1) var<uniform> view    : ViewBlock;
@group(0) @binding(2) var<uniform> frame   : FrameBlock;
@group(0) @binding(3) var<uniform> lights  : LightBlock;
@group(1) @binding(0) var<uniform> object  : ObjectBlock;
@group(2) @binding(0) var<uniform> material: MaterialBlock;

@group(2) @binding(1) var samplerLinear  : sampler;
@group(2) @binding(2) var samplerPoint   : sampler;

// --- Texture bindings
@group(3) @binding(0) var diffuseMap         : texture_2d<f32>; // $Diffuse      (diffuseMap, diffuseMap_Decal)
@group(3) @binding(1) var normalMap          : texture_2d<f32>; // $Normal       (normalMap)
// @group(3) @binding(2) var specularMap     : texture_2d<f32>; // $Specular     (specularMap)
// @group(3) @binding(3) var envMap          : texture_2d<f32>; // $Env          (envMap)
// @group(3) @binding(4) var detailMap       : texture_2d<f32>; // $Detail       (detailMap) .ag=detail normal, .r=diffuse/gloss tint
// @group(3) @binding(5) var translucencyMap : texture_2d<f32>; // $SecondSmoothness, $Translucency (translucencyMap)
// @group(3) @binding(6) var heightMap       : texture_2d<f32>; // $Heightmap    (heightMap) Height for offset bump, POM, silhouette POM, and displacement mapping defined by a Grayscale texture
@group(3) @binding(7) var decalEmissiveMap   : texture_2d<f32>; // $DecalOverlay (decalMap, emissiveIntensity) emittance multiplier or decal
// @group(3) @binding(8) var subsurfaceMap   : texture_2d<f32>; // $Subsurface   (subsurfaceMap, HeightMap2)
// @group(3) @binding(9) var diffuseMap2     : texture_2d<f32>; // $Custom       (DiffuseMap2, MaskTex)
// @group(3) @binding(10)var normalMap2      : texture_2d<f32>; // $CustomSecondaryMap  (BumpMap2)
@group(3) @binding(11) var opacityMap        : texture_2d<f32>; // $Opacity      (opacityMap, BlendMap, DecalOpacityMap)
@group(3) @binding(12) var smoothnessMap     : texture_2d<f32>; // $Smoothness   (smoothnessMap)
@group(3) @binding(13) var emittanceMap      : texture_2d<f32>; // $Emittance    (emittanceMap)
// @group(3) @binding(14) var occlusionMap   : texture_2d<f32>; // $Occlusion    (OcclusionMap)
// @group(3) @binding(15) var specularMap2   : texture_2d<f32>; // $Specular2    (SpecularMap2)
@group(3) @binding(4) var noise2DTex         : texture_2d<f32>;

struct VertexInput {
  @location(0) position : vec3f,
  @location(1) normal   : vec3f,
  @location(2) texture  : vec2f,
  @location(3) tangent  : vec4f,
  @location(4) binormal : vec3f,
  @location(5) color    : vec4f,
};

struct FragmentInput {
  @builtin(position) position      : vec4f,
  @location(0)       uvBase        : vec2f,
  @location(1)       toSun         : vec3f,
  @location(2)       color         : vec4f,
  @location(3)       localPos      : vec3f,
  @location(4)       weatherCenter : vec3f,
  @location(5)       localNrm      : vec3f,
  @location(6)       localTan      : vec3f,
};


@vertex
fn vs_main(input: VertexInput) -> FragmentInput {

  let modelMatrix = object.modelMatrix;
  var vPos = vec4f(input.position.xyz, 1.0);
  var viewRot = view.viewMatrix;
  viewRot[3]  = vec4f(0.0, 0.0, 0.0, 1.0);

  var clipPos   = view.projectionMatrix * viewRot * vPos;
      clipPos.z = 0;// output.position.w; // push to far plane

  let n = normalize(input.normal.xyz);
  let t = normalize(input.tangent.xyz - n * dot(n, input.tangent.xyz));
  let b = cross(n, t) * input.tangent.w;
  let toSun = normalize(vec3f(
    dot(t, global.sunDirection),
    dot(b, global.sunDirection),
    dot(n, global.sunDirection),
  ));

  var uvBase = vec4f(input.texture.xy, 0.0, 1.0);
  if (material.enabledUvModDiffuse == TRUE) {
    uvBase = material.uvModDiffuse * uvBase;
  }

  var output : FragmentInput;
  output.position      = clipPos;
  output.uvBase        = uvBase.xy;
  output.toSun         = toSun;
  output.color         = input.color;
  output.localPos      = input.position.xyz;
  output.localNrm      = input.normal.xyz;
  output.localTan      = input.tangent.xyz;
  // TODO: use model matrix as weather
  output.weatherCenter = view.cameraPosition.xyz;// input.position.xyz;
  // output.weatherCenter = vec3f(
  //   modelMatrix[0].w,
  //   modelMatrix[1].w,
  //   modelMatrix[2].w,
  // );


  return output;
}

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  return psBasic(input);
}

fn psBasic(input: FragmentInput) -> FragmentOutput {
  // ---- Sprite Sheet OFfset
  var scaleOffset = getSpriteScaleOffset();

	const c_numSamples = 8;

	let toSun = normalize(input.toSun.xyz);
	let sampleDir = toSun.xy * material.stepSize;
	let uv = input.uvBase.xy;

  var opacity = textureSample(diffuseMap, samplerLinear, uv).r * input.color.a;
  if (LOCAL_WEATHER) {
    opacity *= getLocalWeatherAlpha(input);
  }

	if (opacity < 0.001) {
		discard;
	}

  var density = 0.0;
  for(var i = 0; i < c_numSamples; i++) {
    let suv = (uv + f32(i) * sampleDir) * scaleOffset.xy + scaleOffset.zw;
		let t = textureSample(diffuseMap, samplerLinear, suv).r;
		density += t;
	}

	let c = exp2( -material.attenuation * density );
	var a = pow( opacity, material.alphaSaturation );
	let col = mix(
    material.skyColorMultiplier * global.cloudShadingCustomSkyColor.xyz,
    material.sunColorMultiplier * global.cloudShadingCustomSunColor.xyz,
    c
  );

	let materialOpacity = 1.0;// GetInstance_Opacity(); //AmbientOp.a * PerMaterial_DiffuseColor.a;
	a = pow(a, 1.0f / (materialOpacity + 0.01f)) * sqrt(materialOpacity) - (1 - materialOpacity) * 0.01;
	a = saturate(a);

  var out: FragmentOutput;
  out.color = vec4f(col * input.color.rgb, a);
  return out;
}

fn psAdvanced(input: FragmentInput) -> FragmentOutput {

  // ---- Sprite Sheet OFfset
  var scaleOffset = getSpriteScaleOffset();

  // ---- Clouds Texture
  var uvBase = input.uvBase * scaleOffset.xy + scaleOffset.zw;
  var height = textureSample(diffuseMap, samplerLinear, uvBase).r;

  // ---- Local Weather
  if (LOCAL_WEATHER) {
    height *= getLocalWeatherAlpha(input);
  }

  if (height - 0.0001 < 0.0) {
    discard;
  }

  var curTracePos = vec3f(input.uvBase.xy, height * material.cloudHeight);
	let toSun = normalize(input.toSun.xyz);

	// Intersection of sun vector with cloud AABB using slabs
  let zeroMask  = toSun == vec3f(0.0);
	let invToSun  = 1.0 / select(toSun, vec3f(0.00001), zeroMask);
	let tbottom   = (vec3f(0.0, 0.0, -material.cloudHeight ) - curTracePos) * invToSun;
	let ttop      = (vec3f(1.0, 1.0, material.cloudHeight ) - curTracePos) * invToSun;
	let tmax      = max( ttop, tbottom );
	let t0        = min( tmax.xx, tmax.yz );
	let distAABB  = min( t0.x, t0.y );
	let sampleDir = toSun * distAABB / f32(NUM_SAMPLES);

	// Accumulate cloud density along sun vector
	var density = 0.0;

	for(var i = 0; i < NUM_SAMPLES; i++) {
		curTracePos += sampleDir;
    let uv = fract(curTracePos.xy) * scaleOffset.xy + scaleOffset.zw;
    let height2 = textureSample(diffuseMap, samplerLinear, uv).r * material.cloudHeight;
    if (abs( curTracePos.z ) < height2) {
      density += height2;
    }
	}

	density *= 64.0 / f32(NUM_SAMPLES);

	// Sky light scattering
	let scatteringSky = exp( -height * material.cloudHeight * material.densitySky );

	// Sun light forward scattering
	let scatteringSun = exp( -material.densitySun * density );

	// Full shading
	var color = vec3f(0.0);
  color += global.cloudShadingCustomSkyColor.xyz * scatteringSky;
  color += global.cloudShadingCustomSunColor.xyz * scatteringSun;

	// Opacity
	var alpha = pow(saturate( height * material.alphaMultiplier ), material.alphaSaturation);

  var out: FragmentOutput;
  out.color = vec4f(color, alpha) * input.color;

  switch (global.debug) {
    // #region Debug Material
    case DEBUG_MTL_ALBEDO: {
      out.color = vec4f(vec3f(scatteringSky), 1.0);
    }
    case DEBUG_MTL_SPECULAR: {
      out.color = vec4f(vec3f(scatteringSun), 1.0);
    }
    case DEBUG_MTL_METALLIC: {

    }
    case DEBUG_MTL_ROUGHNESS: {

    }
    case DEBUG_MTL_IOR: {

    }
    case DEBUG_MTL_EMISSIVE: {

    }
    case DEBUG_MTL_AO: {

    }
    case DEBUG_MTL_OPACITY: {

    }
    case DEBUG_MTL_HEIGHT: {

    }
    case DEBUG_MTL_NOISE: {
      //
    }
    // #endregion


    // #region Debug Geometry / Vectors
    case DEBUG_GV_NORMAL: {
      out.color = vec4f(input.localNrm.xyz * 0.5 + 0.5, 1.5);
    }
    case DEBUG_GV_TANGENT: {
      out.color = vec4f(input.localTan.xyz * 0.5 + 0.5, 1.5);
    }
    case DEBUG_GV_BITANGENT: {

    }
    case DEBUG_GV_SHADE_NORMAL: {

    }
    case DEBUG_GV_POSITION_WS: {

    }
    case DEBUG_GV_DEPTH: {

    }
    // #endregion

    // #region Debug Vertex attributes
    case DEBUG_V_COLOR0: {

    }
    case DEBUG_V_COLOR1: {

    }
    case DEBUG_V_UV0: {

    }
    case DEBUG_V_UV1: {

    }
    // #endregion
    default: {

    }
  }
  return out;
}

fn fmod(x: f32, y: f32) -> f32 {
  return x - y * trunc(x / y);
}

fn getLocalWeatherAlpha(input: FragmentInput) -> f32 {
  var localPos = normalize(input.localPos);

  // Bend the clouds in the lower part of the skydome to simulate the weather going into the horizon because of the planet curvature
  localPos.z = abs(localPos.z); // Allow the clouds not only going to the horizon but a bit lower in case that part of the mesh is visible
  let horizonFactor = saturate(localPos.z / max(0.0001, material.horizonBendingHeight));
  let skyHeight     = material.skyHeight * horizonFactor;

  // Project skydome into a world sky plane
  var worldPos = view.cameraPosition.xyz + localPos * skyHeight / max(0.0001, localPos.z);

  // Fade the cloud based on the Weather Position and Radius
  let distance  = length(input.weatherCenter.xy - worldPos.xy);
  let outRadius = max(0, material.weatherSmoothRadius);
  var alpha    = saturate((outRadius - distance + material.weatherRadius) / abs(material.weatherSmoothRadius));

  // Increase the tiling distance near the horizon to avoid tiling as the dome angle gets more vertical
  worldPos += localPos * (1.0 - horizonFactor) * material.fadingNoiseTilingSize;

  // Distord the alpha using the noise pattern to avoid a perfect circular fading
  let noiseUV = (worldPos.xy + material.fadingNoiseOffset) / material.fadingNoiseTilingSize;
  var noise = textureSampleLevel(noise2DTex, samplerLinear, noiseUV, 0.0).r;
  noise      *= saturate((horizonFactor - 0.5) / 0.5);	// Make noise go toward 0 near the horizon to avoid visible tiling as the dome angle gets more vertical
  alpha       = pow(alpha, 1 + noise * 5);

  return alpha;
}

fn getSpriteScaleOffset() -> vec4f {
  var tileSize = vec2f(1.0);
  var spriteOffset = vec2f(0.0);

  if (SPRITESHEET_MATERIAL) {
    tileSize = 1.0 / vec2f(material.spriteSheetColumns, material.spriteSheetRows);

    let numFrames    = material.spriteSheetNumFrames;
    let initialFrame = 0.0;
    let animTime     = fract(frame.elapsedTime / material.spriteSheetDuration);
    let curFrame     = fmod(floor(initialFrame + animTime * numFrames), numFrames) ;
    let tileX        = curFrame * tileSize.x;
    spriteOffset = vec2f(fract(tileX), floor(tileX) * tileSize.y);
  }
  return vec4f(tileSize.x, tileSize.y, spriteOffset.x, spriteOffset.y);
}

${COMMON_WGSL}
`
