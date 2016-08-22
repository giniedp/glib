//======================================================================
// Functions to pack and unpack a float to and from rgba (8888).
//======================================================================

vec4 EncodeFloat32To8(float value)
{
	const vec4 bitSh	= vec4(256 * 256 * 256, 256 * 256, 256, 1);
	const vec4 bitMsk = vec4(0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);

	vec4 comp;
	comp = value * bitSh;
	comp = frac(comp);
	comp = comp - comp.xxyz * bitMsk;

	return comp;
}

float DecodeFloat8To32(vec4 value)
{
	const vec4 bitShifts = vec4(
		1.0 / (256.0 * 256.0 * 256.0),
		1.0 / (256.0 * 256.0),
		1.0 /  256.0,
		1.0);

	return dot(value.xyzw, bitShifts);
}
