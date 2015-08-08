//======================================================================
// Functions for calculating fog amount
//======================================================================

//----------------------------------------------------------------------
// Calculates linear fog factor
// Parameters:
//    FogStart  : Distance where the fog starts
//    FogEnd    : Distance where the fog ends
//    Distance  : Distance to desired fogged position
//----------------------------------------------------------------------
float FogLinear(in float FogStart, in float FogEnd, in float Distance)
{
    return saturate((Distance - FogStart) / (FogEnd - FogStart));
}

//----------------------------------------------------------------------
// Calculates exponential fog factor
// Parameters:
//    Distance : Distance to desired fogged position
//    Density  : Fog density or thikness
//----------------------------------------------------------------------
float FogExp(in float Distance, in float Density)
{
	return (1.0 / exp(Distance * Density));
}

//----------------------------------------------------------------------
// Calculates exponential squared fog factor
// Parameters:
//    Distance : Distance to desired fogged position
//    Density  : Fog density or thikness
//----------------------------------------------------------------------
float FogExp2(in float Distance, in float Density)
{
	return (1.0 / exp(pow((Distance * Density), 2.0)));
}
