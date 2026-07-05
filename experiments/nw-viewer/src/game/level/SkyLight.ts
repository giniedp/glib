import { Vec3, vec3, type IVec3 } from '@gglib/math'

const LUT_HEIGHT_STEPS = 32
const LUT_ANGULAR_STEPS = 256
const maxAtmosphereHeight = 100.0
const EARTH_RADIUS = 6368.0
const avgDensityHeightMieInv = 1.0 / 1.2
const avgDensityHeightRayleighInv = 1.0 / 7.994

export class SkyLight {
  public km = 0
  public kr = 0
  public g = 0
  public sunIntensity = vec3(20)
  public invRgbWaveLength = vec3(1.0)
  public sunDirection = vec3([0.0, 0.707106, 0.707106])
  public inScatteringStepSize = 1
  private phaseLUT = new Float32Array(LUT_ANGULAR_STEPS * 4)
  private scaleLUT = new Float32Array(LUT_HEIGHT_STEPS * 4)
  private depthLUT = new Float32Array(LUT_HEIGHT_STEPS * LUT_ANGULAR_STEPS * 4)

  public constructor() {
    this.setRgbWaveLengths(650, 570, 475)
    this.setSunDirection(0.0, 0.707106, 0.707106)
    this.setAtmosphericConditions(vec3(20), 0.001, 0.00025, -0.99)
  }

  public setRgbWaveLengths(r: number, g: number, b: number) {
    this.invRgbWaveLength.x = Math.pow(r * 1e-3, -4.0)
    this.invRgbWaveLength.y = Math.pow(g * 1e-3, -4.0)
    this.invRgbWaveLength.z = Math.pow(b * 1e-3, -4.0)
  }

  public setSunDirection(x: number, y: number, z: number) {
    this.sunDirection.x = x
    this.sunDirection.y = y
    this.sunDirection.z = z
    Vec3.normalize(this.sunDirection, this.sunDirection)
  }

  public setAtmosphericConditions(sunIntensity: IVec3, km: number, kr: number, g: number) {
    this.sunIntensity.x = sunIntensity.x
    this.sunIntensity.y = sunIntensity.y
    this.sunIntensity.z = sunIntensity.z
    this.km = km
    this.kr = kr
    this.g = g
  }

  public computePhaseLUT() {
    const g = this.g
    const g2 = g * g
    const miePart = (1.5 * (1.0 - g2)) / (2.0 + g2)
    const steps = this.phaseLUT.length
    for (let i = 0; i < steps; ++i) {
      const cosine = 1 - 2.0 * (i / (steps - 1))
      const cosine2 = cosine * cosine
      const miePhase = (miePart * (1 + cosine2)) / Math.pow(1 + g2 - 2 * g * cosine, 1.5)
      const rayleighPhase = 0.75 * (1.0 + cosine2)
    }
  }

  public computeOpticalLUTs() {
    const cameraLookDir = new Vec3()
    for (let a = 0; a < LUT_HEIGHT_STEPS; ++a) {
      let height = mapIndexToHeight(a)

      // compute optical depth
      for (let i = 0; i < LUT_ANGULAR_STEPS; ++i) {
        // init looking direction of camera
        let cosVertAngle = mapIndexToCosVertAngle(i)
        cameraLookDir.init(Math.sqrt(1.0 - cosVertAngle * cosVertAngle), cosVertAngle, 0)

        // compute optical depth
        let mie = computeOpticalDepth(cameraLookDir, height, avgDensityHeightMieInv)
        let rayleigh = computeOpticalDepth(cameraLookDir, height, avgDensityHeightRayleighInv)

        // blend out previous values once camera ray hits earth
        // if (false == b0 && false == b1 && i > 0) {
        //   e = m_opticalDepthLUT.back();
        //   e.mie = (f32) ((f32)0.5 * (e.mie + c_opticalDepthWhenHittingEarth));
        //   e.rayleigh = (f32) ((f32)0.5 * (e.rayleigh + c_opticalDepthWhenHittingEarth));
        // }

        // store result
        this.depthLUT[(a * LUT_ANGULAR_STEPS + i) * 4 + 0] = mie || 0
        this.depthLUT[(a * LUT_ANGULAR_STEPS + i) * 4 + 1] = rayleigh || 0
        // m_opticalDepthLUT.push_back(e);
      }

      {
        // compute optical scale
        // SOpticalScaleLUTEntry e;
        const atmosphereLayerHeight = height
        const mie = opticalScaleFunction(height, avgDensityHeightMieInv)
        const rayleigh = opticalScaleFunction(height, avgDensityHeightRayleighInv)
        this.scaleLUT[a * 4 + 0] = mie
        this.scaleLUT[a * 4 + 1] = rayleigh
        this.scaleLUT[a * 4 + 2] = atmosphereLayerHeight
        // m_opticalScaleLUT.push_back(e);
      }
    }
  }
}

function computeOpticalDepth(cameraLookDir: IVec3, cameraHeight: number, avgDensityHeightInv: number): number | null {
  // init camera position
  const cameraPos = Vec3.$0.init(0.0, cameraHeight + EARTH_RADIUS, 0.0)

  // check if ray hits earth
  // compute B, and C of quadratic function (A=1, as looking direction is normalized)
  const B = 2.0 * Vec3.dot(cameraPos, cameraLookDir)
  const Bsq = B * B
  const Cpart = Vec3.dot(cameraPos, cameraPos)
  let C = Cpart - EARTH_RADIUS * EARTH_RADIUS
  let det = Bsq - 4.0 * C

  const hitsEarth = det >= 0.0 && (0.5 * (-B - Math.sqrt(det)) > 1e-4 || 0.5 * (-B + Math.sqrt(det)) > 1e-4)
  if (hitsEarth) {
    // depth = (float)c_opticalDepthWhenHittingEarth;
    return null
  }

  // find intersection with atmosphere top
  C = Cpart - (maxAtmosphereHeight + EARTH_RADIUS) * (maxAtmosphereHeight + EARTH_RADIUS)
  det = Bsq - 4.0 * C
  // assert(det >= 0.0);   // ray defined outside the atmosphere
  let t = 0.5 * (-B + Math.sqrt(det))
  //assert(t >= -1e-4);
  if (t < 0.0) {
    t = 0.0
  }

  // integrate depth along ray from camera to atmosphere top
  let _depth = 0.0

  let numInitialSamples = t | 0
  numInitialSamples = numInitialSamples < 2 ? 2 : numInitialSamples

  let lastCameraPos = cameraPos
  for (let i = 1; i < numInitialSamples; ++i) {
    const curCameraPos = Vec3.createFrom(cameraPos).addScaled(cameraLookDir, t * (i / numInitialSamples))
    _depth += integrateOpticalDepth(lastCameraPos, curCameraPos, avgDensityHeightInv, 1e-1)
    lastCameraPos = curCameraPos
  }

  // assert(_depth >= 0.0 && _depth < 1e25);
  // assert(0 != _finite(_depth));

  return _depth
}

function mapIndexToHeight(index: number): number {
  const x = index / (LUT_HEIGHT_STEPS - 1)
  return maxAtmosphereHeight * Math.exp(mapSaveExpArg(10.0 * (x - 1.0))) * x
}

function mapIndexToCosVertAngle(index: number): number {
  return 1.0 - 2.0 * (index / (LUT_ANGULAR_STEPS - 1))
}

function mapIndexToCosPhaseAngle(index: number): number {
  return 1.0 - 2.0 * (index / (LUT_ANGULAR_STEPS - 1))
}

function mapSaveExpArg(arg: number) {
  const saveExpArgRange = 650 // -650.0 to 650 range is safe not to introduce fp over-/underflows
  if (arg < -saveExpArgRange) {
    return -saveExpArgRange
  }
  if (arg > saveExpArgRange) {
    return saveExpArgRange
  }
  return arg
}

function opticalScaleFunction(height: number, avgDensityHeightInv: number): number {
  return Math.exp(mapSaveExpArg(-height * avgDensityHeightInv))
}

function integrateOpticalDepth(start: IVec3, end: IVec3, avgDensityHeightInv: number, error: number): number {
  const startScale = opticalScaleFunction(Vec3.len(start) - EARTH_RADIUS, avgDensityHeightInv)
  const endScale = opticalScaleFunction(Vec3.len(end) - EARTH_RADIUS, avgDensityHeightInv)
  return integrateOpticalDepthInternal(start, startScale, end, endScale, avgDensityHeightInv, error)
}

function integrateOpticalDepthInternal(
  start: IVec3,
  startScale: number,
  end: IVec3,
  endScale: number,
  avgDensityHeightInv: number,
  error: number,
) {
  // assert(_finite(startScale) &&  _finite(endScale));

  const mid = Vec3.createFrom(start).add(end).multiplyScalar(0.5)
  const midScale = opticalScaleFunction(mid.length() - EARTH_RADIUS, avgDensityHeightInv)

  if (Math.abs(startScale - midScale) <= error && Math.abs(midScale - endScale) <= error) {
    // integrate section this via simpson rule and stop recursing
    const c_oneSixth = 1.0 / 6.0
    return (startScale + 4.0 * midScale + endScale) * c_oneSixth * Vec3.distance(end, start)
  }
  // refine section via recursing down left and right branch
  return (
    integrateOpticalDepthInternal(start, startScale, mid, midScale, avgDensityHeightInv, error) +
    integrateOpticalDepthInternal(mid, midScale, end, endScale, avgDensityHeightInv, error)
  )
}
