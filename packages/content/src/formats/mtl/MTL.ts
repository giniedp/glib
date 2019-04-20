export interface MtlData {
  /**
   * Name of the material.
   *
   * @remarks
   * Names may be any length but cannot include blanks.  Underscores may be used in material names.
   */
  name?: string

  /**
   * Ambient reflectivity using RGB values
   */
  Ka?: number[]
  /**
   * Diffuse reflectivity using RGB values
   */
  Kd?: number[]
  /**
   * Specular reflectivity using RGB values
   */
  Ks?: number[]
  /**
   * Transmission filter using RGB values
   */
  Tf?: number[]
  /**
   * Illumination model to use in the material
   * - 0 Color on and Ambient off
   * - 1 Color on and Ambient on
   * - 2 Highlight on
   * - 3 Reflection on and Ray trace on
   * - 4 Transparency: Glass on
   *     Reflection: Ray trace on
   * - 5 Reflection: Fresnel on and Ray trace on
   * - 6 Transparency: Refraction on
   *     Reflection: Fresnel off and Ray trace on
   * - 7 Transparency: Refraction on
   *     Reflection: Fresnel on and Ray trace on
   * - 8 Reflection on and Ray trace off
   * - 9 Transparency: Glass on
   *     Reflection: Ray trace off
   * - 10 Casts shadows onto invisible surfaces
   */
  illum?: string
  /**
   * Dissolve factor for the current material
   *
   * @remarks
   * A factor of 1.0 is fully opaque.  This is the default when a new material
   * is created.  A factor of 0.0 is fully dissolved (completely transparent)
   */
  d?: number
  /**
   * Specular exponent for the current material.
   *
   * @remarks
   * This defines the focus of the specular highlight.
   * A high exponent results in a tight, concentrated highlight.
   * Ns values normally range from 0 to 1000
   */
  Ns?: number
  /**
   * Sharpness of the reflections from the local reflection map
   *
   * @remarks
   * Can be a number from 0 to 1000.  The default is 60.
   * A high value results in a clear reflection of objects in the reflection map
   */
  sharpness?: number
  /**
   * Specifies the optical density for the surface.
   *
   * @remarks
   * This is also known as index of refraction.
   * The values can range from 0.001 to 10.  A value of 1.0 means that light does not bend
   * as it passes through an object.  Increasing the optical_density increases the amount of bending.
   * Glass has an index of refraction of about 1.5.  Values of less than 1.0 produce bizarre
   * results and are not recommended.
   */
  Ni?: number
  /**
   * Ambient texture
   *
   * @remarks
   * During rendering, the "map_Ka" value is multiplied by the "Ka" value.
   */
  map_Ka?: MtlTextureData
  /**
   * Diffuse texture
   *
   * @remarks
   * During rendering, the "map_Kd" value is multiplied by the "Kd" value.
   */
  map_Kd?: MtlTextureData
  /**
   * Specular texture
   *
   * @remarks
   * During rendering, the "map_Ks" value is multiplied by the "Ks" value.
   */
  map_Ks?: MtlTextureData
  /**
   * Specular exponent texture
   *
   * @remarks
   * During rendering, the "map_Ns" value is multiplied by the "Ns" value.
   */
  map_Ns?: MtlTextureData
  /**
   * Dissolve texture
   *
   * @remarks
   * During rendering, the "map_d" value is multiplied by the "d" value.
   */
  map_d?: MtlTextureData
  /**
   * Turns on anti-aliasing of textures in this material without anti-aliasing all textures in the scene.
   */
  map_aat?: boolean
  /**
   * Bump texture
   */
  bump?: MtlTextureData
  /**
   * Displacement texture
   */
  disp?: MtlTextureData
  /**
   * Reflection texture
   */
  refl?: MtlTextureData
  /**
   * Decal mask texture
   *
   * @remarks
   * During rendering, the Ka, Kd, and Ks values and the map_Ka, map_Kd, and map_Ks values
   * are blended according to the following formula:
   *
   * `result_color=tex_color(tv)*decal(tv)+mtl_color*(1.0-decal(tv))`
   */
  decal?: MtlTextureData
}

export interface MtlTextureData {
  /**
   * The file name
   */
  file: string
  /**
   * The texture options
   */
  options?: MtlTextureOptions
}

export interface MtlTextureOptions {
  /**
   * Specifies a bump multiplier.
   *
   * @remarks
   * Values stored with the texture or procedural texture file are multiplied by this value before they are applied to the  surface.
   */
  bm?: number
  /**
   * Turns clamping `on` or `off`. The default is `off`.
   *
   * @remarks
   * When clamping is on, textures are restricted to 0-1 in the uvw range.
   */
  clamp?: boolean
  /**
   * Turns color correction for the texture `on` or `off`
   */
  cc?: boolean
  /**
   * turns texture blending in the horizontal direction (u direction) `on` or `off`.  The default is `on`.
   */
  blendu?: boolean
  /**
   * turns texture blending in the vertical direction (v direction) `on` or `off`.  The default is `on`.
   */
  blendv?: boolean
  /**
   * Specifies the channel used to create a scalar or bump texture
   *
   * @remarks
   * Scalar textures are applied to:
   *  - transparency
   *  - specular exponent
   *  - decal
   *  - displacement
   *
   * The channel choices are:
   *   - r specifies the **red** channel.
   *   - g specifies the **green** channel.
   *   - b specifies the **blue** channel.
   *   - m specifies the **matte** channel.
   *   - l specifies the **luminance** channel.
   *   - z specifies the **z-depth** channel.
   *
   * The default for bump and scalar textures is "l" (luminance), unless you are building a decal.
   * In that case, the default is "m" (matte).
   */
  imfchan?: 'r' | 'g' | 'b' | 'm' | 'l' | 'z'
  /**
   * Increases the sharpness, or clarity, of mip-mapped texture files
   *
   * @remarks
   * is any non-negative floating point value representing the
   * degree of increased clarity; the greater the value, the greater the
   * clarity.
   */
  boost?: number
  /**
   * modifies the range over which scalar or color texture values may vary
   */
  mm?: {
    /**
     * adds a base value to the texture values.
     *
     * @remarks
     * A positive value makes everything brighter; a negative value makes everything dimmer.
     * The default is 0; the range is unlimited.
     */
    base: number,
    /**
     * expands the range of the texture values.
     *
     * @remarks
     * Increasing the number increases the contrast.
     * The default is 1;
     * the range is unlimited.
     */
    gain: number,
  }
  /**
   * Offsets the position of the texture. The default is 0, 0, 0
   */
  o?: number | number[]
  /**
   * Scales the size of the texture. The default is 1, 1, 1.
   */
  s?: number | number[]
  /**
   * Turns on turbulence for textures
   *
   * @remarks
   * Adding turbulence to a texture along a specified direction adds variance to the
   * original image and allows a simple image to be repeated over a larger area
   * without noticeable tiling effects.
   */
  t?: number | number[]
  /**
   * The resolution of texture created when an image is used
   */
  texres?: number
}

function readBool(data: string): boolean {
  return data === 'on'
}
function readFloat(item: string, fallback: number = void 0): number {
  if (item) {
    return parseFloat(item)
  }
  return fallback
}

function readFloatArray(data: string): number[] {
  return data.trim().split(' ').map(readFloat)
}

function readRGBArray(rgb: string): number[] {
  let result = rgb.trim().split(' ').map(readFloat)
  if (result.length < 2) {
    result[1] = result[0]
  }
  if (result.length < 3) {
    result[2] = result[0]
  }
  result.length = 3
  return result
}

function readTexture(data: string): any {
  const result: any = {}
  const index = data.lastIndexOf(' ')
  if (index < 0) {
    result.options = readTextureOptions('')
    result.file = data
  } else {
    result.options = readTextureOptions(data.substr(0, index))
    result.file = data.substr(index + 1).trim()
  }
  return result
}

function readTextureOptions(data: string) {
  const result: MtlTextureOptions = {
    blendu: true,
    blendv: true,
    clamp: false,
    imfchan: 'l',
    mm: {
      base: 0,
      gain: 1,
    },
    o: [0, 0, 0],
    s: [1, 1, 1],
  }
  const split = data.split(/-(?!\d)/)
  for (const item of split) {
    const match = item.match(/^(\w+)\s+(.*)$/)
    if (!match) {
      continue
    }
    const key = match[1]
    const value = match[2]

    switch (key) {
      case 'imfchan':
        result[key] = value as any
        break
      case 'mm':
        result[key] = {
          base: readFloat(value.split(' ')[0], 0),
          gain: readFloat(value.split(' ')[1], 1),
        }
        break
      case 'bm':
      case 'boost':
      case 'texres':
        result[key] = readFloat(value)
        break
      case 'o':
      case 's':
      case 't':
        result[key] = readFloatArray(value)
        break
      case 'clamp':
      case 'cc':
      case 'blendu':
      case 'blendv':
        result[key] = readBool(value)
        break
      default:
    }
  }
  return result
}

function readMtl(data: string): MtlData[] {
  const lines = data.split(/\r?\n/g)
  const materials: MtlData[] = []

  let currentLine = ''
  for (let line of lines) {
    // remove comments
    const cIndex = line.indexOf('#')
    if (cIndex >= 0) {
      line = line.substr(0, cIndex)
    }

    // trim whitespaces
    line = line.replace(/\s+/g, ' ').trim()

    // skip blank lines
    if (!line) {
      continue
    }

    // join multi line strings
    if (line.match(/\\$/)) {
      currentLine = currentLine + line.replace(/\\$/, '')
      continue
    } else if (currentLine) {
      line = currentLine + line
      currentLine = ''
    }

    // parse line
    const match = line.match(/^(\w+)\s+(.*)$/)
    if (!match) {
      continue
    }
    let key = match[1]
    const value = match[2]

    if (key === 'newmtl') {
      materials.push({ name: value })
      continue
    }

    if (key === 'Tr') {
      key = 'd'
    }

    const material = materials[materials.length - 1]
    switch (key) {
      case 'Ka':
      case 'Kd':
      case 'Ks':
      case 'Tf':
        material[key] = readRGBArray(value)
        break

      case 'd':
      case 'Ns':
      case 'sharpness':
      case 'Ni':
        material[key] = readFloat(value)
        break

      case 'map_Ka':
      case 'map_Kd':
      case 'map_Ks':
      case 'map_Ns':
      case 'map_d':
      case 'bump':
      case 'disp':
      case 'refl':
      case 'decal':
        material[key] = readTexture(value)
        break
      case 'illum':
        material[key] = value
        break
      case 'map_aat':
        material[key] = readBool(value)
        break
      default:
    }
  }
  return materials
}

/**
 * The parser implementation is based on the format specification from http://paulbourke.net/dataformats/mtl/
 */
export class MTL {
  public static parse(data: string): MtlData[] {
    return readMtl(data)
  }
}
