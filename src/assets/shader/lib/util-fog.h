//======================================================================
// Functions for calculating fog amount
//======================================================================

//----------------------------------------------------------------------
// Calculates linear fog factor
// Parameters:
//    fogStart  : Distance where the fog starts
//    fogEnd    : Distance where the fog ends
//    distance  : Distance to desired fogged position
//----------------------------------------------------------------------
float fogLinear(in float fogStart, in float fogEnd, in float distance)
{
    return saturate((distance - fogStart) / (fogEnd - fogStart));
}

//----------------------------------------------------------------------
// Calculates smooth fog factor
// Parameters:
//    fogStart  : Distance where the fog starts
//    fogEnd    : Distance where the fog ends
//    distance  : Distance to desired fogged position
//----------------------------------------------------------------------
float fogSmooth(in float fogStart, in float fogEnd, in float distance)
{
    return smoothstep(fogStart,fogEnd, distance);
}

//----------------------------------------------------------------------
// Calculates exponential fog factor
// Parameters:
//    distance : Distance to desired fogged position
//    density  : Fog density or thikness
//----------------------------------------------------------------------
float fogExp(in float distance, in float density)
{
	return (1.0 / exp(distance * density));
}

//----------------------------------------------------------------------
// Calculates exponential squared fog factor
// Parameters:
//    Distance : Distance to desired fogged position
//    Density  : Fog density or thikness
//----------------------------------------------------------------------
float fogExp2(in float distance, in float density)
{
	return (1.0 / exp(pow((distance * density), 2.0)));
}
