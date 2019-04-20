/**
 * Describes a 4x4 matrix type
 */
export type Matrix = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
]

/**
 * Specifies a geometric vertex and its x y z coordinates. Rational
 * curves and surfaces require a fourth homogeneous coordinate, also
 * called the weight.
 */
export type Vertex = [number, number, number, number?]

/**
 * Specifies a texture vertex and its coordinates.
 * A 1D texture requires only 1 texture coordinates,
 * a 2D texture requires 2 texture coordinates,
 * and a 3D texture requires all three coordinates.
 */
export type VertexTexture = [number, number?, number?]

/**
 * Specifies a normal vector with components x, y, and z.
 *
 * Vertex normals affect the smooth-shading and rendering of geometry.
 * For polygons, vertex normals are used in place of the actual facet
 * normals.  For surfaces, vertex normals are interpolated over the
 * entire surface and replace the actual analytic surface normal.
 *
 * When vertex normals are present, they supersede smoothing groups.
 */
export type VertexNormal = [number, number, number]

/**
 * Specifies a point in the parameter space of a curve or surface.
 *
 * The usage determines how many coordinates are required. Special
 * points for curves require a 1D control point (u only) in the
 * parameter space of the curve. Special points for surfaces require a
 * 2D point (u and v) in the parameter space of the surface. Control
 * points for non-rational trimming curves require u and v
 * coordinates. Control points for rational trimming curves require u,
 * v, and w (weight) coordinates.
 */
export type VertexPoint = [number, number, number?]

export interface FreeFormAttributes {
  /**
   * Specifies the type of curve or surface
   */
  cstype?: 'bmatrix' | 'bezier' | 'bspline' | 'cardinal' | 'taylor'
  /**
   * Indicates a rational or non-rational form of the curve or surface
   */
  rat?: boolean
  /**
   * Polynomial degree in the u direction. It is required for both
   * curves and surfaces
   */
  degU?: number
  /**
   * Polynomial degree in the v direction. It is required only for
   * surfaces. For Bezier, B-spline, Taylor, and basis matrix, there is
   * no default; a value must be supplied. For Cardinal, the degree is
   * always 3. If some other value is given for Cardinal, it will be
   * ignored
   */
  degV?: number
  /**
   * Basis matrix that is applied in v direction
   */
  bmatU?: Matrix
  /**
   * Basis matrix that is applied in v direction
   */
  bmatV?: Matrix
  /**
   * Step size in the u direction.
   * It is required for both curves and surfaces that use a basis matrix.
   */
  stepU?: number
  /**
   * Step size in the v direction.
   * It is required only for surfaces that use a basis matrix.
   */
  stepV?: number
}

export interface RenderAttributes {
  /**
   * Sets bevel interpolation on or off.
   *
   * @remarks
   * It works only with beveled objects, that is, objects with sides
   * separated by beveled faces.
   *
   * Bevel interpolation uses normal vector interpolation to give an
   * illusion of roundness to a flat bevel. It does not affect the
   * smoothing of non-bevelled faces.
   *
   * Bevel interpolation does not alter the geometry of the original
   * object.
   */
  bevel?: boolean
  /**
   * Sets color interpolation on or off
   *
   * @remarks
   * Color interpolation creates a blend across the surface of a polygon
   * between the materials assigned to its vertices. This creates a
   * blending of colors across a face element.
   *
   * To support color interpolation, materials must be assigned per
   * vertex, not per element. The illumination models for all materials
   * of vertices attached to the polygon must be the same. Color
   * interpolation applies to the values for ambient (Ka), diffuse (Kd),
   * specular (Ks), and specular highlight (Ns) material properties.
   */
  c_interp?: boolean
  /**
   * Sets dissolve interpolation on or off.
   *
   * @remarks
   * Dissolve interpolation creates an interpolation or blend across a
   * polygon between the dissolve (d) values of the materials assigned
   * to its vertices. This feature is used to create effects exhibiting
   * varying degrees of apparent transparency, as in glass or clouds.
   *
   * To support dissolve interpolation, materials must be assigned per
   * vertex, not per element. All the materials assigned to the vertices
   * involved in the dissolve interpolation must contain a dissolve
   * factor command to specify a dissolve.
   */
  d_interp?: boolean
  /**
   * Sets the level of detail to be displayed in a PreView animation.
   * The level of detail feature lets you control which elements of an
   * object are displayed while working in PreView.
   */
  lod?: number
  /**
   * This is a rendering identifier that specifies the map library file
   * for the texture map definitions set with the usemap identifier. You
   * can specify multiple filenames with maplib. If multiple filenames
   * are specified, the first file listed is searched first for the map
   * definition, the second file is searched next, and so on.
   */
  maplib?: string
  /**
   * This is a rendering identifier that specifies the texture map name
   * for the element following it. To turn off texture mapping, specify
   * off instead of the map name.
   */
  usemap?: string
  /**
   * Specifies the material name for the element following it. Once a
   * material is assigned, it cannot be turned off; it can only be
   * changed.
   */
  usemtl?: string
  /**
   * Specifies the material library file for the material definitions
   * set with the usemtl statement. You can specify multiple filenames
   * with mtllib. If multiple filenames are specified, the first file
   * listed is searched first for the material definition, the second
   * file is searched next, and so on.
   */
  mtllib?: string[]
  /**
   * Specifies the shadow object filename. This object is used to cast
   * shadows for the current object. Shadows are only visible in a
   * rendered image; they cannot be seen using hardware shading. The
   * shadow object is invisible except for its shadow.
   */
  shadow_obj?: string
  /**
   * Specifies the ray tracing object filename. This object will be used
   * in generating reflections of the current object on reflective
   * surfaces.  Reflections are only visible in a rendered image; they
   * cannot be seen using hardware shading.
   */
  trace_obj?: string
  /**
   * Specifies a curve approximation technique. The arguments specify
   * the technique and resolution for the curve.
   */
  ctech?: string
  /**
   * Specifies a surface approximation technique. The arguments specify
   * the technique and resolution for the surface.
   */
  stech?: string
}

export interface Curve2DReference {
  /**
   * u0 is the starting parameter value for the curve curv2d.
   */
  u0: number
  /**
   * u1 is the ending parameter value for the curve curv2d.
   */
  u1: number
  /**
   * curv2d is the index of the curve lying in the parameter space of the surface.
   */
  curv2d: number
}

export interface BodyStatement<T = string, D = any> {
  type: T
  data: D
}
/**
 * Specifies global parameter values. For B-spline curves and
 * surfaces, this specifies the knot vectors.
 */
export type ParmStatement = BodyStatement<'parm u' | 'parm v', [number, number, ...number[]]>
/**
 * Specifies a sequence of curves to build a single outer trimming loop.
 */
export type TrimStatement = BodyStatement<'trim', Curve2DReference[]>
/**
 * Specifies a sequence of curves to build a single inner trimming loop (hole).
 */
export type HoleStatement = BodyStatement<'hole', Curve2DReference[]>
/**
 * Specifies a sequence of curves which lie on the given surface to
 * build a single special curve.
 */
export type ScrvStatement = BodyStatement<'scrv', Curve2DReference[]>
/**
 * Specifies special geometric points to be associated with a curve or
 * surface. For space curves and trimming curves, the parameter
 * vertices must be 1D. For surfaces, the parameter vertices must be
 * 2D.
 */
export type SpStatement = BodyStatement<'sp', number[]>

/**
 * References geometric vertex element
 */
export interface VertexRef {
  v: number
}
/**
 * References geometric and texture vertex elements
 */
export interface VertexTextureRef {
  v: number
  vt?: number
}
/**
 * References geometric, texture and normal vertex elements
 */
export interface VertexTextureNormalRef {
  v: number
  vt?: number
  vn?: number
}
/**
 * References a single control point
 */
export interface PointRef {
  vp: number
}

export interface Element<T = string> {
  /**
   * The geometry type
   */
  type: T

  group: Group
  state: RenderAttributes
}

/**
 * Specifies a point element and its vertex. You can specify multiple
 * points with this statement. Although points cannot be shaded or
 * rendered, they are used by other Advanced Visualizer programs.
 */
export interface PointElement extends Element<'p'> {
  /**
   * vertex reference number for a point element. Each point
   * element requires one vertex.
   */
  data: [VertexRef, ...VertexRef[]]
}
/**
 * Specifies a line and its vertex reference numbers. You can
 * optionally include the texture vertex reference numbers. Although
 * lines cannot be shaded or rendered, they are used by other Advanced
 * Visualizer programs.
 */
export interface LineElement extends Element<'l'> {
  data: [VertexTextureRef, VertexTextureRef, ...VertexTextureRef[]]
}
export interface FaceElement extends Element<'f'> {
  data: VertexTextureNormalRef[]
}
export interface CurveElement extends Element<'curv'> {
  /**
   * u0 is the starting parameter value for the curve.
   */
  u0: number
  /**
   * u1 is the ending parameter value for the curve.
   */
  u1: number
  /**
   * control vertices
   */
  data: [VertexRef, ...VertexRef[]]
  /**
   *
   */
  body: BodyStatement[]
  /**
   *
   */
  attr: FreeFormAttributes
}
export interface Curve2DElement extends Element<'curv2'> {
  /**
   * control vertices
   */
  data: [PointRef, ...PointRef[]]
  /**
   *
   */
  body: BodyStatement[]
  /**
   *
   */
  attr: FreeFormAttributes
}
export interface SurfaceElement extends Element<'surf'> {
  /**
   * s0 is the starting parameter value for the surface in the u direction
   */
  s0: number
  /**
   * s1 is the ending parameter value for the surface in the u direction.
   */
  s1: number
  /**
   * t0 is the starting parameter value for the surface in the v direction.
   */
  t0: number
  /**
   * t1 is the ending parameter value for the surface in the v direction.
   */
  t1: number
  /**
   * control vertices
   */
  data: [VertexTextureNormalRef, ...VertexTextureNormalRef[]]
  /**
   *
   */
  body: BodyStatement[]
  /**
   *
   */
  attr: FreeFormAttributes
}

export interface Group {
  /**
   * The group name
   */
  g: string[]
  /**
   * A user-defined object name
   */
  o: string
  /**
   * The smoothing group number
   */
  s: number
  /**
   * The merging group and merge resolution for the free-form surfaces
   *
   * @remarks
   * Adjacency detection is performed only within groups, never between
   * groups. Connectivity between surfaces in different merging groups
   * is not allowed. Surfaces in the same merging group are merged
   * together along edges that are within the distance res apart.
   */
  mg: [number, number]
}

export interface Data {
  v?: Vertex[]
  vp?: VertexPoint[]
  vt?: VertexTexture[]
  vn?: VertexNormal[]

  p?: PointElement[]
  l?: LineElement[]
  f?: FaceElement[]
  curv?: CurveElement[]
  curv2?: Curve2DElement[]
  surf?: SurfaceElement[]
}

export interface ParseOptions {
  /**
   * Indicates whether the y texture coordinate should be flipped
   */
  flipY?: boolean
}

function readFloat(item: string): number {
  return item ? parseFloat(item) : null
}

function readFloatArray(item: string, minLength: 16, maxLength: 16): Matrix
function readFloatArray(item: string, minLength: 2): [number, number, ...number[]]
function readFloatArray(item: string, minLength: 2, maxLength: 2): [number, number]
function readFloatArray(item: string, minLength: 1): [number, ...number[]]
function readFloatArray(item: string, minLength: 1, maxLength: 1): [number]
function readFloatArray(item: string, minLength?: number, maxLength?: number): number[]
function readFloatArray(item: string, minLength?: number, maxLength?: number): number[] {
  const result = item.split(' ').map(readFloat)
  if (minLength != null && result.length < minLength) {
    result.length = minLength
  }
  if (maxLength != null && result.length > maxLength) {
    result.length = maxLength
  }
  return result
}
function readTriplet(item: string): number[] {
  return item.split('/').map(readFloat)
}

function readTripletArray(item: string): number[][] {
  return item.split(' ').map(readTriplet)
}

function readRefArray(item: string,  minLength: 2): [VertexTextureNormalRef, VertexTextureNormalRef, ...VertexTextureNormalRef[]]
function readRefArray(item: string,  minLength: 1): [VertexTextureNormalRef, ...VertexTextureNormalRef[]]
function readRefArray(item: string): VertexTextureNormalRef[]
function readRefArray(item: string): VertexTextureNormalRef[] {
  return readTripletArray(item).map((it) => {
    const result: VertexTextureNormalRef = {
      v: it[0],
    }
    if (it[1] != null) {
      result.vt = it[1]
    }
    if (it[2] != null) {
      result.vn = it[2]
    }
    return result
  })
}

function readCurv2DRef(input: string) {
  const result: Curve2DReference[] = []
  const arr = readFloatArray(input)
  while (arr.length) {
    result.push({
      u0: arr[0],
      u1: arr[1],
      curv2d: arr[2],
    })
    arr.shift()
    arr.shift()
    arr.shift()
  }
  return result
}

function makeAbsoluteIndex(index: number, buffer: any[]): number {
  return index < 0 ? buffer.length + index : index - 1
}

function append<T>(arr: T[], el: T, tap?: (el: T) => void): T[] {
  arr = arr || []
  arr.push(el)
  if (tap) {
    tap(el)
  }
  return arr
}

function appendIfExists<T>(arr: T[], el: T, tap?: (el: T) => void): T[] {
  if (arr) {
    arr.push(el)
    if (tap) {
      tap(el)
    }
  }
  return arr
}

function eachLine(input: string, cb: (line: string) => void) {
  for (let line of input.split(/\r?\n/g)) {
    // remove comments
    let cIndex = line.indexOf('#')
    if (cIndex >= 0) {
      line = line.substr(0, cIndex)
    }
    // collapse whitespaces
    line = line.replace(/\s+/g, ' ').trim()
    // skip blank lines
    if (line) {
      cb(line)
    }
  }
}

function parse(input: string): Data {
  const data: Data = {}
  let group: Group = {
    g: ['default'],
    o: '',
    s: 0,
    mg: [0, 0],
  }
  let freeForm: FreeFormAttributes = {}
  let state: RenderAttributes = {}
  let body: BodyStatement[]

  eachLine(input, (line) => {
    const index = line.indexOf(' ')
    const key = index > 0 ? line.substring(0, index) : line
    const value = index > 0 ? line.substring(index + 1, line.length) : ''

    switch (key) {
      // GROUP
      case 'g':
        group = {
          g: value.split(/\s+/g),
          o: '',
          s: 0,
          mg: [0, 0],
        }
        break
      case 'o':
        group.o = value
        break
      case 's':
        group.s = readFloat(value)
        break
      case 'mg':
        group.mg = readFloatArray(value, 2, 2)
        break
      // STATE
      case 'bevel':
      case 'c_interp':
      case 'd_interp':
        state[key] = value === 'on'
        break
      case 'lod':
        state.lod = readFloat(value)
        break
      case 'usemap':
        state.usemap = value === 'off' ? null : value
        break
      case 'maplib':
      case 'usemtl':
      case 'shadow_obj':
      case 'trace_obj':
      case 'ctech':
      case 'stech':
        state[key] = value
        break
      case 'mtllib':
        state[key] = value.split(' ')
        break
      // DATA
      case 'v':
      case 'vt':
      case 'vn':
      case 'vp':
        data[key] = append(data[key], readFloatArray(value) as any)
        break
      // FREE FORM DATA
      case 'cstype':
        const [rat, cstype] = value.split(' ')
        freeForm.cstype = (cstype == null ? rat : cstype) as any
        freeForm.rat = rat === 'rat'
        break
      case 'deg':
        [freeForm.degU, freeForm.degV] = readFloatArray(value, 2, 2)
        break
      case 'bmat':
        if (value[0] === 'u') {
          freeForm.bmatU = readFloatArray(value.substring(2), 16, 16)
        }
        if (value[0] === 'v') {
          freeForm.bmatV = readFloatArray(value.substring(2), 16, 16)
        }
        break
      case 'step':
        [freeForm.stepU, freeForm.stepV] = readFloatArray(value, 2, 2)
        break
      // ELEMENTS
      case 'p':
        data.p = append<PointElement>(data.p, {
          type: 'p',
          group: {
            ...group,
          },
          state: {
            ...state,
          },
          data: readRefArray(value, 1),
        }, (p) => {
          p.data.forEach((it) => {
            if (it.v != null) {
              it.v = makeAbsoluteIndex(it.v, data.v)
            }
          })
        })
        break
      case 'l':
        data.l = append<LineElement>(data.l, {
          type: 'l',
          group: {
            ...group,
          },
          state: {
            ...state,
          },
          data: readRefArray(value, 2),
        }, (l) => {
          l.data.forEach((it) => {
            if (it.v != null) {
              it.v = makeAbsoluteIndex(it.v, data.v)
            }
            if (it.vt != null) {
              it.vt = makeAbsoluteIndex(it.vt, data.vt)
            }
          })
        })
        break
      case 'f':
        data.f = append<FaceElement>(data.f, {
          type: 'f',
          group: {
            ...group,
          },
          state: {
            ...state,
          },
          data: readRefArray(value),
        }, (f) => {
          f.data.forEach((it) => {
            if (it.v != null) {
              it.v = makeAbsoluteIndex(it.v, data.v)
            }
            if (it.vt != null) {
              it.vt = makeAbsoluteIndex(it.vt, data.vt)
            }
            if (it.vn != null) {
              it.vn = makeAbsoluteIndex(it.vn, data.vn)
            }
          })
        })
        break
      // FREE FORM ELEMENTS
      case 'curv':
        const curvData = readFloatArray(value)
        body = []
        data.curv = append<CurveElement>(data.curv, {
          type: 'curv',
          group: {
            ...group,
          },
          state: {
            ...state,
          },
          attr: {
            ...freeForm,
          },
          u0: curvData[0],
          u1: curvData[1],
          body: body,
          data: curvData.slice(2).map((v): VertexRef => {
            return { v: makeAbsoluteIndex(v, data.v) }
          }) as [VertexRef, ...VertexRef[]],
        })
        break
      case 'curv2':
        const curv2Data = readFloatArray(value)
        body = []
        data.curv2 = append<Curve2DElement>(data.curv2, {
          type: 'curv2',
          group: {
            ...group,
          },
          state: {
            ...state,
          },
          attr: {
            ...freeForm,
          },
          body: body,
          data: curv2Data.map((v): PointRef => {
            return { vp: makeAbsoluteIndex(v, data.vp) }
          }) as [PointRef, ...PointRef[]],
        })
        break
      case 'surf':
        const surfData = value.split(' ')
        body = []
        data.surf = append<SurfaceElement>(data.surf, {
          type: 'surf',
          group: {
            ...group,
          },
          state: {
            ...state,
          },
          attr: {
            ...freeForm,
          },
          body: body,
          s0: readFloat(surfData[0]),
          s1: readFloat(surfData[1]),
          t0: readFloat(surfData[2]),
          t1: readFloat(surfData[3]),
          data: surfData.slice(4).map((it): VertexTextureNormalRef => {
            const triplet = readTriplet(it)
            const result: VertexTextureNormalRef = {
              v: makeAbsoluteIndex(triplet[0], data.v),
            }
            if (triplet[1] != null) {
              result.vt = makeAbsoluteIndex(triplet[1], data.vt)
            }
            if (triplet[2] != null) {
              result.vn = makeAbsoluteIndex(triplet[2], data.vn)
            }
            return result
          }) as [VertexTextureNormalRef, ...VertexTextureNormalRef[]],
        })
        break
      // FREE FORM BODY STATEMENTS
      case 'parm':
        appendIfExists(body, {
          type: `parm ${value['0']}`,
          data: readFloatArray(value.substr(2), 2),
        })
        break
      case 'trim':
      case 'hole':
      case 'scrv':
        appendIfExists<BodyStatement<string, Curve2DReference[]>>(body, {
          type: key,
          data: readCurv2DRef(value),
        }, (it) => {
          it.data.forEach((ref) => {
            ref.curv2d = makeAbsoluteIndex(ref.curv2d, data.curv2)
          })
        })
        break
      case 'sp':
        appendIfExists(body, {
          type: 'sp',
          data: readFloatArray(value),
        })
        break
      case 'end':
        body = null
        break
      default:
        console.warn('[OBJ] ignored statement:', line)
        break
    }
  })

  return data
}

export class OBJ {
  public static parse(content: string, options: ParseOptions = {}): Data {
    return parse(content)
  }
}
