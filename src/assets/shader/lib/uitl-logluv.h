//======================================================================
// Functions for encoding and decoding the
// the LogLuv format, based on Marco Salvi's "NAO32"
// technique used for Heavenly Sword.
// Optimized version by Christer Ericson:
// (http://realtimecollisiondetection.net/blog/?p=15).
//======================================================================

// M matrix, for encoding
const static mat3 M = mat3(
    0.2209, 0.3390, 0.4184,
    0.1138, 0.6780, 0.7319,
    0.0102, 0.1130, 0.2969);

// Inverse M matrix, for decoding
const static mat3 InverseM = mat3(
	6.0013,	-2.700,	-1.7995,
	-1.332,	3.1029,	-5.7720,
	.3007,	-1.088,	5.6268);

vec4 LogLuvEncode(vec3 vRGB)
{
    vec4 vResult;
    vec3 Xp_Y_XYZp = M * vRGB;
    Xp_Y_XYZp = max(Xp_Y_XYZp, vec3(1e-6, 1e-6, 1e-6));
    vResult.xy = Xp_Y_XYZp.xy / Xp_Y_XYZp.z;
    float Le = 2 * log2(Xp_Y_XYZp.y) + 127;
    vResult.w = frac(Le);
    vResult.z = (Le - (floor(vResult.w*255.0))/255.0)/255.0;
    return vResult;
}

vec3 LogLuvDecode(vec4 vLogLuv)
{
	float Le = vLogLuv.z * 255 + vLogLuv.w;
	vec3 Xp_Y_XYZp;
	Xp_Y_XYZp.y = exp2((Le - 127) / 2);
	Xp_Y_XYZp.z = Xp_Y_XYZp.y / vLogLuv.y;
	Xp_Y_XYZp.x = vLogLuv.x * Xp_Y_XYZp.z;
	float3 vRGB = mul(Xp_Y_XYZp, InverseM);
	return max(vRGB, 0);
}

