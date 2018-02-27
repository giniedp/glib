export interface MtlData {
  name?: string
  Ka?: number[]
  Kd?: number[]
  Ks?: number[]
  Tf?: number[]
  illum?: string
  d?: number
  Ns?: number
  sharpness?: number
  Ni?: number
  map_Ka?: MtlTextureData
  map_Kd?: MtlTextureData
  map_Ks?: MtlTextureData
  map_Ns?: MtlTextureData
  map_d?: MtlTextureData
  bump?: MtlTextureData
  disp?: MtlTextureData
  refl?: MtlTextureData
  decal?: MtlTextureData
}
export interface MtlTextureData {
  file: string
  options: MtlTextureOptions
}
export interface MtlTextureOptions {
  bm?: number
  clamp?: boolean
  cc?: boolean
  blendu?: boolean
  blendv?: boolean
  imfchan?: string
  boost?: number
  mm?: {base: number, gain: number}
  o?: number
  s?: number
  t?: number
  texres?: number
}

function getLines(value: string): string[] {
  return value.replace(/\r/g, '\n').split('\n')
}

/**
 * The parser implementation is based on the format specification from http://paulbourke.net/dataformats/mtl/
 */
export class MTL {
  public materials: MtlData[]
  public material: MtlData

  public static parse(content: string): MtlData[] {
    return new MTL().parse(content)
  }
  public parse(data: string): MtlData[] {
    let lines = getLines(data)
    this.materials = []
    this.material = {}

    let currentLine = ''
    for (let line of lines) {
      // remove comments
      let cIndex = line.indexOf('#')
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
      let match = line.match(/^(\w+)\s+(.*)$/)
      if (!match) {
        continue
      }
      let key = match[1]
      let value = match[2]

      let staticReader = MTL[`read_${key}`]
      let instanceReader = this[`read_${key}`]
      if (staticReader) {
        this.material[key] = staticReader(value)
      } else if (instanceReader) {
        instanceReader.apply(this, [value])
      }
    }
    return this.materials
  }

  // newmtl name
  //
  // Specifies the start of a material description and assigns a name to the
  // material.  An .mtl file must have one newmtl statement at the start of
  // each material description.
  //
  // "name" is the name of the material.  Names may be any length but
  // cannot include blanks.  Underscores may be used in material names.
  public read_newmtl(name: string) {
    this.material = { name: name }
    this.materials.push(this.material)
  }

  // Ka r g b
  //
  // The Ka statement specifies the ambient reflectivity using RGB values.
  //
  // "r g b" are the values for the red, green, and blue components of the
  // color.  The g and b arguments are optional.  If only r is specified,
  // then g, and b are assumed to be equal to r.  The r g b values are
  // normally in the range of 0.0 to 1.0.  Values outside this range increase
  // or decrease the relectivity accordingly.
  public static read_Ka(rgb: string) {
    return MTL.readRGBArray(rgb)
  }

  // Kd r g b
  //
  // The Kd statement specifies the diffuse reflectivity using RGB values.
  //
  // "r g b" are the values for the red, green, and blue components of the
  // atmosphere.  The g and b arguments are optional.  If only r is
  // specified, then g, and b are assumed to be equal to r.  The r g b values
  // are normally in the range of 0.0 to 1.0.  Values outside this range
  // increase or decrease the relectivity accordingly.
  public static read_Kd(rgb: string) {
    return MTL.readRGBArray(rgb)
  }

  // Ks r g b
  //
  // The Ks statement specifies the specular reflectivity using RGB values.
  //
  // "r g b" are the values for the red, green, and blue components of the
  // atmosphere.  The g and b arguments are optional.  If only r is
  // specified, then g, and b are assumed to be equal to r.  The r g b values
  // are normally in the range of 0.0 to 1.0.  Values outside this range
  // increase or decrease the relectivity accordingly.
  public static read_Ks(rgb: string) {
    return MTL.readRGBArray(rgb)
  }

  // Tf r g b
  //
  // To specify the transmission filter of the current material, you can use
  // the "Tf" statement, the "Tf spectral" statement, or the "Tf xyz"
  // statement.
  //
  // Any light passing through the object is filtered by the transmission
  // filter, which only allows the specifiec colors to pass through.  For
  // example, Tf 0 1 0 allows all the green to pass through and filters out
  // all the red and blue.
  //
  // "r g b" are the values for the red, green, and blue components of the
  // atmosphere.  The g and b arguments are optional.  If only r is
  // specified, then g, and b are assumed to be equal to r.  The r g b values
  // are normally in the range of 0.0 to 1.0.  Values outside this range
  // increase or decrease the relectivity accordingly.
  public static read_Tf(data: string) {
    return MTL.readRGBArray(data)
  }

  // illum illum_#
  //
  // The "illum" statement specifies the illumination model to use in the
  // material.  Illumination models are mathematical equations that represent
  // various material lighting and shading effects.
  //
  // "illum_#"can be a number from 0 to 10.  The illumination models are
  // summarized below; for complete descriptions see "Illumination models" on
  // page 5-30.
  //
  // Illumination    Properties that are turned on in the
  // model           Property Editor
  //
  // 0		Color on and Ambient off
  // 1		Color on and Ambient on
  // 2		Highlight on
  // 3		Reflection on and Ray trace on
  // 4		Transparency: Glass on
  //      Reflection: Ray trace on
  // 5		Reflection: Fresnel on and Ray trace on
  // 6		Transparency: Refraction on
  //      Reflection: Fresnel off and Ray trace on
  // 7		Transparency: Refraction on
  //      Reflection: Fresnel on and Ray trace on
  // 8		Reflection on and Ray trace off
  // 9		Transparency: Glass on
  //      Reflection: Ray trace off
  // 10		Casts shadows onto invisible surfaces
  public static read_illum(data: string) {
    return data
  }

  // d factor
  //
  // Specifies the dissolve for the current material.
  //
  // "factor" is the amount this material dissolves into the background.  A
  // factor of 1.0 is fully opaque.  This is the default when a new material
  // is created.  A factor of 0.0 is fully dissolved (completely
  // transparent).
  //
  // Unlike a real transparent material, the dissolve does not depend upon
  // material thickness nor does it have any spectral character.  Dissolve
  // works on all illumination models.
  public static read_d(factor: string) {
    return MTL.readFloat(factor)
  }
  public read_Tr(factor: string) {
    this.material.d = MTL.readFloat(factor)
  }

  // Ns exponent
  //
  // Specifies the specular exponent for the current material.  This defines
  // the focus of the specular highlight.
  //
  // "exponent" is the value for the specular exponent.  A high exponent
  // results in a tight, concentrated highlight.  Ns values normally range
  // from 0 to 1000.
  public static read_Ns(exponent: string) {
    return MTL.readFloat(exponent)
  }

  // sharpness value
  //
  // Specifies the sharpness of the reflections from the local reflection
  // map.  If a material does not have a local reflection map defined in its
  // material definition, sharpness will apply to the global reflection map
  // defined in PreView.
  //
  // "value" can be a number from 0 to 1000.  The default is 60.  A high
  // value results in a clear reflection of objects in the reflection map.
  public static read_sharpness(value: string) {
    return MTL.readFloat(value)
  }

  // Ni optical_density
  //
  // Specifies the optical density for the surface.  This is also known as
  // index of refraction.
  //
  // "optical_density" is the value for the optical density.  The values can
  // range from 0.001 to 10.  A value of 1.0 means that light does not bend
  // as it passes through an object.  Increasing the optical_density
  // increases the amount of bending.  Glass has an index of refraction of
  // about 1.5.  Values of less than 1.0 produce bizarre results and are not
  // recommended.
  public static read_Ni(opticalDensity: string) {
    return MTL.readFloat(opticalDensity)
  }

  // map_Ka -options args filename
  //
  // Specifies that a color texture file or a color procedural texture file
  // is applied to the ambient reflectivity of the material.  During
  // rendering, the "map_Ka" value is multiplied by the "Ka" value.
  public static read_map_Ka(data: string) {
    return MTL.readTexture(data)
  }

  // map_Kd -options args filename
  //
  // Specifies that a color texture file or color procedural texture file is
  // linked to the diffuse reflectivity of the material.  During rendering,
  // the map_Kd value is multiplied by the Kd value.
  public static read_map_Kd(data: string) {
    return MTL.readTexture(data)
  }

  // map_Ks -options args filename
  //
  // Specifies that a color texture file or color procedural texture file is
  // linked to the specular reflectivity of the material.  During rendering,
  // the map_Ks value is multiplied by the Ks value.
  public static read_map_Ks(data: string) {
    return MTL.readTexture(data)
  }

  // map_Ns -options args filename
  //
  // Specifies that a scalar texture file or scalar procedural texture file
  // is linked to the specular exponent of the material.  During rendering,
  // the map_Ns value is multiplied by the Ns value.
  public static read_map_Ns(data: string) {
    return MTL.readTexture(data)
  }

  // map_d -options args filename
  // Specifies that a scalar texture file or scalar procedural texture file
  // is linked to the dissolve of the material.  During rendering, the map_d
  // value is multiplied by the d value.
  public static read_map_d(data: string) {
    return MTL.readTexture(data)
  }

  // bump -options args filename
  //
  // Specifies that a bump texture file or a bump procedural texture file is
  // linked to the material.
  public static read_bump(data: string) {
    return MTL.readTexture(data)
  }
  public read_map_bump(data: string) {
    this.material.bump = MTL.readTexture(data)
  }

  // disp -options args filename
  //
  // Specifies that a scalar texture is used to deform the surface of an
  // object, creating surface roughness.
  public static read_disp(data: string) {
    return MTL.readTexture(data)
  }

  // TODO:
  public static read_refl(data: string) {
    return MTL.readTexture(data)
  }

  // decal -options args filename
  //
  // Specifies that a scalar texture file or a scalar procedural texture
  // file is used to selectively replace the material color with the texture
  // color.
  public static read_decal(data: string) {
    return MTL.readTexture(data)
  }

  // map_aat on
  //
  // Turns on anti-aliasing of textures in this material without anti-
  // aliasing all textures in the scene.
  public static read_map_aat(data: string) {
    return data === 'on'
  }

  public static readFloat(item: string): number {
    if (item) {
      return parseFloat(item)
    }
    return void 0
  }

  // "r g b" are the values for the red, green, and blue components of the
  // atmosphere.  The g and b arguments are optional.  If only r is
  // specified, then g, and b are assumed to be equal to r.  The r g b values
  // are normally in the range of 0.0 to 1.0.  Values outside this range
  // increase or decrease the relectivity accordingly.
  public static readRGBArray(rgb: string): number[] {
    let result = rgb.split(' ').map(MTL.readFloat)
    if (result.length < 2) {
      result[1] = result[0]
    }
    if (result.length < 3) {
      result[2] = result[0]
    }
    result.length = 3
    return result
  }

  public static readFloatArray(data: string): number[] {
    return data.split(' ').map(MTL.readFloat)
  }

  // map_Ka -options args filename
  //
  // -blendu on | off
  // -blendv on | off
  // -cc on | off
  // -clamp on | off
  // -mm base gain
  // -o u v w
  // -s u v w
  // -t u v w
  // -texres value
  public static readTexture(data: string): any {
    let result: any = {}
    data = data.trim()
    let index = data.lastIndexOf(' ')
    if (index < 0) {
      result.options = {}
      result.file = data
    } else {
      result.options = MTL.readTextureOptions(data.substr(0, index))
      result.file = data.substr(index)
    }
    return result
  }

  public static readTextureOptions(data: string) {
    let result = {}
    let split = data.split('-')
    for (let item of split) {
      let match = item.match(/^(\w+)\s+(.*)$/)
      if (!match) {
        continue
      }
      let key = match[1]
      let value = match[2]

      let reader = MTL[`readOption_${key}`]
      if (reader) {
        result[key] = reader(value)
      }
    }
    return result
  }

  // -bm mult
  //
  // The -bm option specifies a bump multiplier.  You can use it only with
  // the "bump" statement.  Values stored with the texture or procedural
  // texture file are multiplied by this value before they are applied to the
  // surface.
  //
  // "mult" is the value for the bump multiplier.  It can be positive or
  // negative.  Extreme bump multipliers may cause odd visual results because
  // only the surface normal is perturbed and the surface position does not
  // change.  For best results, use values between 0 and 1.
  public static readOption_bm(data: string) {
    return MTL.readFloat(data)
  }

  // -clamp on | off
  //
  // The -clamp option turns clamping on or off.  When clamping is on,
  // textures are restricted to 0-1 in the uvw range.  The default is off.
  public static readOption_clamp(data: string) {
    return data === 'on'
  }

  // -cc on | off
  //
  // The -cc option turns on color correction for the texture.  You can use
  // it only with the color map statements:  map_Ka, map_Kd, and map_Ks.
  public static readOption_cc(data: string) {
    return data === 'on'
  }

  // -blenu on | off
  //
  // The -blendu option turns texture blending in the horizontal direction
  // (u direction) on or off.  The default is on.
  public static readOption_blendu(data: string) {
    return data !== 'off'
  }

  // -blenv on | off
  //
  // The -blendv option turns texture blending in the vertical direction (v
  // direction) on or off.  The default is on.
  public static readOption_blendv(data: string) {
    return data === 'off'
  }

  // -imfchan r | g | b | m | l | z
  //
  // The -imfchan option specifies the channel used to create a scalar or
  // bump texture.  Scalar textures are applied to:
  //
  // transparency
  // specular exponent
  // decal
  // displacement
  //
  // The channel choices are:
  //
  // r specifies the red channel.
  // g specifies the green channel.
  // b specifies the blue channel.
  // m specifies the matte channel.
  // l specifies the luminance channel.
  // z specifies the z-depth channel.
  //
  // The default for bump and scalar textures is "l" (luminance), unless you
  // are building a decal.  In that case, the default is "m" (matte).
  public static readOption_imfchan(data: string) {
    return data
  }

  // -boost value
  //
  // The -boost option increases the sharpness, or clarity, of mip-mapped
  // texture files -- that is, color (.mpc), scalar (.mps), and bump (.mpb)
  // files.  If you render animations with boost, you may experience some
  // texture crawling.  The effects of boost are seen when you render in
  // Image or test render in Model or PreView; they aren't as noticeable in
  // Property Editor.
  //
  // "value" is any non-negative floating point value representing the
  // degree of increased clarity; the greater the value, the greater the
  // clarity.  You should start with a boost value of no more than 1 or 2 and
  // increase the value as needed.  Note that larger values have more
  // potential to introduce texture crawling when animated.
  public static readOption_boost(data: string) {
    return MTL.readFloat(data)
  }

  // -mm base gain
  //
  // The -mm option modifies the range over which scalar or color texture
  // values may vary.  This has an effect only during rendering and does not
  // change the file.
  //
  // "base" adds a base value to the texture values.  A positive value makes
  // everything brighter; a negative value makes everything dimmer.  The
  // default is 0; the range is unlimited.
  //
  // "gain" expands the range of the texture values.  Increasing the number
  // increases the contrast.  The default is 1; the range is unlimited.
  public static readOption_mm(data: string) {
    let split = data.split(' ')
    return {
      base: MTL.readFloat(split[0]),
      gain: MTL.readFloat(split[1]),
    }
  }

  // -o u v w
  //
  // The -o option offsets the position of the texture map on the surface by
  // shifting the position of the map origin.  The default is 0, 0, 0.
  //
  // "u" is the value for the horizontal direction of the texture
  //
  // "v" is an optional argument.
  // "v" is the value for the vertical direction of the texture.
  //
  // "w" is an optional argument.
  // "w" is the value used for the depth of a 3D texture.
  public static readOption_o(data: string) {
    return MTL.readFloatArray(data)
  }

  // -s u v w
  //
  // The -s option scales the size of the texture pattern on the textured
  // surface by expanding or shrinking the pattern.  The default is 1, 1, 1.
  //
  // "u" is the value for the horizontal direction of the texture
  //
  // "v" is an optional argument.
  // "v" is the value for the vertical direction of the texture.
  //
  // "w" is an optional argument.
  // "w" is a value used for the depth of a 3D texture.
  // "w" is a value used for the amount of tessellation of the displacement map.
  public static readOption_s(data: string) {
    return MTL.readFloatArray(data)
  }

  // -t u v w
  //
  // The -t option turns on turbulence for textures.  Adding turbulence to a
  // texture along a specified direction adds variance to the original image
  // and allows a simple image to be repeated over a larger area without
  // noticeable tiling effects.
  //
  // turbulence also lets you use a 2D image as if it were a solid texture,
  // similar to 3D procedural textures like marble and granite.
  //
  // "u" is the value for the horizontal direction of the texture
  // turbulence.
  //
  // "v" is an optional argument.
  // "v" is the value for the vertical direction of the texture turbulence.
  //
  // "w" is an optional argument.
  // "w" is a value used for the depth of the texture turbulence.
  //
  // By default, the turbulence for every texture map used in a material is
  // uvw = (0,0,0).  This means that no turbulence will be applied and the 2D
  // texture will behave normally.
  //
  // Only when you raise the turbulence values above zero will you see the
  // effects of turbulence.
  public static readOption_t(data: string) {
    return MTL.readFloatArray(data)
  }

  // -texres resolution
  //
  // The -texres option specifies the resolution of texture created when an
  // image is used.  The default texture size is the largest power of two
  // that does not exceed the original image size.
  //
  // If the source image is an exact power of 2, the texture cannot be built
  // any larger.  If the source image size is not an exact power of 2, you
  // can specify that the texture be built at the next power of 2 greater
  // than the source image size.
  //
  // The original image should be square, otherwise, it will be scaled to
  // fit the closest square size that is not larger than the original.
  // Scaling reduces sharpness.
  public static readOption_texres(data: string) {
    return MTL.readFloat(data)
  }
}
