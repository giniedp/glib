import { IVec3, linearToSrgb, srgbToLinear, type IVec4 } from '@gglib/math'

function denormalize(value: number): number {
  return Math.round(value * 255) & 0xff
}

function normalize(value: number): number {
  return value / 255
}

/**
 * @public
 */
export class Color implements Readonly<IVec4> {
  public static create(r: number, g: number, b: number, a: number): Color {
    return new Color(r, g, b, a)
  }

  public static fromBytes(r: number, g: number, b: number, a: number): Color {
    return new Color(normalize(r), normalize(g), normalize(b), normalize(a))
  }

  public static fromHex(rgb: string): Color {
    let hex = rgb.replace('#', '')
    if (hex.length === 3) {
      hex = [...hex].map((c) => c + c).join('')
    }
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
    return new Color(normalize(r), normalize(g), normalize(b), 1)
  }

  /**
   * Packs the color to an uint32, suitable for rgba8unorm vertex buffers.
   * Produces little-endian memory layout: [R, G, B, A].
   */
  public static packToRGBA(value: Color | IVec4): number {
    const result =
      (denormalize(value.w) << 24) |
      (denormalize(value.z) << 16) |
      (denormalize(value.y) << 8) |
      (denormalize(value.x) << 0)
    return result >>> 0
  }

  public static toBytes(value: Color | IVec4): [number, number, number, number] {
    return [denormalize(value.x), denormalize(value.y), denormalize(value.z), denormalize(value.w)]
  }

  public static toByteArray(...args: Array<Color | IVec4>) {
    const result = new Uint8Array(args.length * 4)
    for (let i = 0; i < args.length; i++) {
      const color = args[i]
      result[i * 4 + 0] = denormalize(color.x)
      result[i * 4 + 1] = denormalize(color.y)
      result[i * 4 + 2] = denormalize(color.z)
      result[i * 4 + 3] = denormalize(color.w)
    }
    return result
  }

  public static readonly AliceBlue = Color.fromBytes(240, 248, 255, 255)
  public static readonly AntiqueWhite = Color.fromBytes(250, 235, 215, 255)
  public static readonly Aqua = Color.fromBytes(0, 255, 255, 255)
  public static readonly Aquamarine = Color.fromBytes(127, 255, 212, 255)
  public static readonly Azure = Color.fromBytes(240, 255, 255, 255)
  public static readonly Beige = Color.fromBytes(245, 245, 220, 255)
  public static readonly Bisque = Color.fromBytes(255, 228, 196, 255)
  public static readonly Black = Color.fromBytes(0, 0, 0, 255)
  public static readonly BlanchedAlmond = Color.fromBytes(255, 235, 205, 255)
  public static readonly Blue = Color.fromBytes(0, 0, 255, 255)
  public static readonly BlueViolet = Color.fromBytes(138, 43, 226, 255)
  public static readonly Brown = Color.fromBytes(165, 42, 42, 255)
  public static readonly BurlyWood = Color.fromBytes(222, 184, 135, 255)
  public static readonly CadetBlue = Color.fromBytes(95, 158, 160, 255)
  public static readonly Chartreuse = Color.fromBytes(127, 255, 0, 255)
  public static readonly Chocolate = Color.fromBytes(210, 105, 30, 255)
  public static readonly Coral = Color.fromBytes(255, 127, 80, 255)
  public static readonly CornflowerBlue = Color.fromBytes(100, 149, 237, 255)
  public static readonly Cornsilk = Color.fromBytes(255, 248, 220, 255)
  public static readonly Crimson = Color.fromBytes(220, 20, 60, 255)
  public static readonly Cyan = Color.fromBytes(0, 255, 255, 255)
  public static readonly DarkBlue = Color.fromBytes(0, 0, 139, 255)
  public static readonly DarkCyan = Color.fromBytes(0, 139, 139, 255)
  public static readonly DarkGoldenrod = Color.fromBytes(184, 134, 11, 255)
  public static readonly DarkGray = Color.fromBytes(169, 169, 169, 255)
  public static readonly DarkGreen = Color.fromBytes(0, 100, 0, 255)
  public static readonly DarkKhaki = Color.fromBytes(189, 183, 107, 255)
  public static readonly DarkMagenta = Color.fromBytes(139, 0, 139, 255)
  public static readonly DarkOliveGreen = Color.fromBytes(85, 107, 47, 255)
  public static readonly DarkOrange = Color.fromBytes(255, 140, 0, 255)
  public static readonly DarkOrchid = Color.fromBytes(153, 50, 204, 255)
  public static readonly DarkRed = Color.fromBytes(139, 0, 0, 255)
  public static readonly DarkSalmon = Color.fromBytes(233, 150, 122, 255)
  public static readonly DarkSeaGreen = Color.fromBytes(143, 188, 139, 255)
  public static readonly DarkSlateBlue = Color.fromBytes(72, 61, 139, 255)
  public static readonly DarkSlateGray = Color.fromBytes(47, 79, 79, 255)
  public static readonly DarkTurquoise = Color.fromBytes(0, 206, 209, 255)
  public static readonly DarkViolet = Color.fromBytes(148, 0, 211, 255)
  public static readonly DeepPink = Color.fromBytes(255, 20, 147, 255)
  public static readonly DeepSkyBlue = Color.fromBytes(0, 191, 255, 255)
  public static readonly DimGray = Color.fromBytes(105, 105, 105, 255)
  public static readonly DodgerBlue = Color.fromBytes(30, 144, 255, 255)
  public static readonly Firebrick = Color.fromBytes(178, 34, 34, 255)
  public static readonly FloralWhite = Color.fromBytes(255, 250, 240, 255)
  public static readonly ForestGreen = Color.fromBytes(34, 139, 34, 255)
  public static readonly Fuchsia = Color.fromBytes(255, 0, 255, 255)
  public static readonly Gainsboro = Color.fromBytes(220, 220, 220, 255)
  public static readonly GhostWhite = Color.fromBytes(248, 248, 255, 255)
  public static readonly Gold = Color.fromBytes(255, 215, 0, 255)
  public static readonly Goldenrod = Color.fromBytes(218, 165, 32, 255)
  public static readonly Gray = Color.fromBytes(128, 128, 128, 255)
  public static readonly Green = Color.fromBytes(0, 128, 0, 255)
  public static readonly GreenYellow = Color.fromBytes(173, 255, 47, 255)
  public static readonly Honeydew = Color.fromBytes(240, 255, 240, 255)
  public static readonly HotPink = Color.fromBytes(255, 105, 180, 255)
  public static readonly IndianRed = Color.fromBytes(205, 92, 92, 255)
  public static readonly Indigo = Color.fromBytes(75, 0, 130, 255)
  public static readonly Ivory = Color.fromBytes(255, 255, 240, 255)
  public static readonly Khaki = Color.fromBytes(240, 230, 140, 255)
  public static readonly Lavender = Color.fromBytes(230, 230, 250, 255)
  public static readonly LavenderBlush = Color.fromBytes(255, 240, 245, 255)
  public static readonly LawnGreen = Color.fromBytes(124, 252, 0, 255)
  public static readonly LemonChiffon = Color.fromBytes(255, 250, 205, 255)
  public static readonly LightBlue = Color.fromBytes(173, 216, 230, 255)
  public static readonly LightCoral = Color.fromBytes(240, 128, 128, 255)
  public static readonly LightCyan = Color.fromBytes(224, 255, 255, 255)
  public static readonly LightGoldenrodYellow = Color.fromBytes(250, 250, 210, 255)
  public static readonly LightGray = Color.fromBytes(211, 211, 211, 255)
  public static readonly LightGreen = Color.fromBytes(144, 238, 144, 255)
  public static readonly LightPink = Color.fromBytes(255, 182, 193, 255)
  public static readonly LightSalmon = Color.fromBytes(255, 160, 122, 255)
  public static readonly LightSeaGreen = Color.fromBytes(32, 178, 170, 255)
  public static readonly LightSkyBlue = Color.fromBytes(135, 206, 250, 255)
  public static readonly LightSlateGray = Color.fromBytes(119, 136, 153, 255)
  public static readonly LightSteelBlue = Color.fromBytes(176, 196, 222, 255)
  public static readonly LightYellow = Color.fromBytes(255, 255, 224, 255)
  public static readonly Lime = Color.fromBytes(0, 255, 0, 255)
  public static readonly LimeGreen = Color.fromBytes(50, 205, 50, 255)
  public static readonly Linen = Color.fromBytes(250, 240, 230, 255)
  public static readonly Magenta = Color.fromBytes(255, 0, 255, 255)
  public static readonly Maroon = Color.fromBytes(128, 0, 0, 255)
  public static readonly MediumAquamarine = Color.fromBytes(102, 205, 170, 255)
  public static readonly MediumBlue = Color.fromBytes(0, 0, 205, 255)
  public static readonly MediumOrchid = Color.fromBytes(186, 85, 211, 255)
  public static readonly MediumPurple = Color.fromBytes(147, 112, 219, 255)
  public static readonly MediumSeaGreen = Color.fromBytes(60, 179, 113, 255)
  public static readonly MediumSlateBlue = Color.fromBytes(123, 104, 238, 255)
  public static readonly MediumSpringGreen = Color.fromBytes(0, 250, 154, 255)
  public static readonly MediumTurquoise = Color.fromBytes(72, 209, 204, 255)
  public static readonly MediumVioletRed = Color.fromBytes(199, 21, 133, 255)
  public static readonly MidnightBlue = Color.fromBytes(25, 25, 112, 255)
  public static readonly MintCream = Color.fromBytes(245, 255, 250, 255)
  public static readonly MistyRose = Color.fromBytes(255, 228, 225, 255)
  public static readonly Moccasin = Color.fromBytes(255, 228, 181, 255)
  public static readonly NavajoWhite = Color.fromBytes(255, 222, 173, 255)
  public static readonly Navy = Color.fromBytes(0, 0, 128, 255)
  public static readonly OldLace = Color.fromBytes(253, 245, 230, 255)
  public static readonly Olive = Color.fromBytes(128, 128, 0, 255)
  public static readonly OliveDrab = Color.fromBytes(107, 142, 35, 255)
  public static readonly Orange = Color.fromBytes(255, 165, 0, 255)
  public static readonly OrangeRed = Color.fromBytes(255, 69, 0, 255)
  public static readonly Orchid = Color.fromBytes(218, 112, 214, 255)
  public static readonly PaleGoldenrod = Color.fromBytes(238, 232, 170, 255)
  public static readonly PaleGreen = Color.fromBytes(152, 251, 152, 255)
  public static readonly PaleTurquoise = Color.fromBytes(175, 238, 238, 255)
  public static readonly PaleVioletRed = Color.fromBytes(219, 112, 147, 255)
  public static readonly PapayaWhip = Color.fromBytes(255, 239, 213, 255)
  public static readonly PeachPuff = Color.fromBytes(255, 218, 185, 255)
  public static readonly Peru = Color.fromBytes(205, 133, 63, 255)
  public static readonly Pink = Color.fromBytes(255, 192, 203, 255)
  public static readonly Plum = Color.fromBytes(221, 160, 221, 255)
  public static readonly PowderBlue = Color.fromBytes(176, 224, 230, 255)
  public static readonly Purple = Color.fromBytes(128, 0, 128, 255)
  public static readonly Red = Color.fromBytes(255, 0, 0, 255)
  public static readonly RosyBrown = Color.fromBytes(188, 143, 143, 255)
  public static readonly RoyalBlue = Color.fromBytes(65, 105, 225, 255)
  public static readonly SaddleBrown = Color.fromBytes(139, 69, 19, 255)
  public static readonly Salmon = Color.fromBytes(250, 128, 114, 255)
  public static readonly SandyBrown = Color.fromBytes(244, 164, 96, 255)
  public static readonly SeaGreen = Color.fromBytes(46, 139, 87, 255)
  public static readonly SeaShell = Color.fromBytes(255, 245, 238, 255)
  public static readonly Sienna = Color.fromBytes(160, 82, 45, 255)
  public static readonly Silver = Color.fromBytes(192, 192, 192, 255)
  public static readonly SkyBlue = Color.fromBytes(135, 206, 235, 255)
  public static readonly SlateBlue = Color.fromBytes(106, 90, 205, 255)
  public static readonly SlateGray = Color.fromBytes(112, 128, 144, 255)
  public static readonly Snow = Color.fromBytes(255, 250, 250, 255)
  public static readonly SpringGreen = Color.fromBytes(0, 255, 127, 255)
  public static readonly SteelBlue = Color.fromBytes(70, 130, 180, 255)
  public static readonly Tan = Color.fromBytes(210, 180, 140, 255)
  public static readonly Teal = Color.fromBytes(0, 128, 128, 255)
  public static readonly Thistle = Color.fromBytes(216, 191, 216, 255)
  public static readonly Tomato = Color.fromBytes(255, 99, 71, 255)
  public static readonly TransparentBlack = Color.fromBytes(0, 0, 0, 0)
  public static readonly TransparentWhite = Color.fromBytes(255, 255, 255, 0)
  public static readonly Turquoise = Color.fromBytes(64, 224, 208, 255)
  public static readonly Violet = Color.fromBytes(238, 130, 238, 255)
  public static readonly Wheat = Color.fromBytes(245, 222, 179, 255)
  public static readonly White = Color.fromBytes(255, 255, 255, 255)
  public static readonly WhiteSmoke = Color.fromBytes(245, 245, 245, 255)
  public static readonly Yellow = Color.fromBytes(255, 255, 0, 255)
  public static readonly YellowGreen = Color.fromBytes(154, 205, 50, 255)

  /**
   * The red component, usually between 0 and 1
   */
  public readonly r: number = 0
  /**
   * The green component, usually between 0 and 1
   */
  public readonly g: number = 0
  /**
   * The blue component, usually between 0 and 1
   */
  public readonly b: number = 0
  /**
   * The alpha component, usually between 0 and 1
   */
  public readonly a: number = 0

  /**
   * Alias for `r`
   */
  public get x(): number {
    return this.r
  }

  /**
   * Alias for `g`
   */
  public get y(): number {
    return this.g
  }

  /**
   * Alias for `b`
   */
  public get z(): number {
    return this.b
  }

  /**
   * Alias for `a`
   */
  public get w(): number {
    return this.a
  }

  /**
   * The red component as byte between 0 and 255
   */
  public get R(): number {
    return denormalize(this.r)
  }

  /**
   * The green component as byte between 0 and 255
   */
  public get G(): number {
    return denormalize(this.g)
  }

  /**
   * The blue component as byte between 0 and 255
   */
  public get B(): number {
    return denormalize(this.b)
  }

  /**
   * The alpha component as byte between 0 and 255
   */
  public get A(): number {
    return denormalize(this.a)
  }

  /**
   * Creates a new color with the given components.Components are assumed to be normalized between 0 and 1.
   *
   * @param r
   * @param g
   * @param b
   * @param a
   */
  public constructor(r: number, g: number, b: number, a: number = 1) {
    this.r = r
    this.g = g
    this.b = b
    this.a = a
  }

  /**
   * Returns a new color value with RGB components converted from SRGB to Linear
   */
  public toLinear(): Color {
    return new Color(srgbToLinear(this.r), srgbToLinear(this.g), srgbToLinear(this.b), this.a)
  }

  /**
   * Returns a new color value with RGB components converted from Linear to SRGB
   */
  public toSrgb(): Color {
    return new Color(linearToSrgb(this.r), linearToSrgb(this.g), linearToSrgb(this.b), this.a)
  }

  /**
   * Returns this color as `IVec3`
   */
  public toVec3(out?: IVec3): IVec3 {
    out ||= { x: 0, y: 0, z: 0 }
    out.x = this.r
    out.y = this.g
    out.z = this.b
    return out
  }

  /**
   * Returns this color as `IVec4`
   */
  public toVec4(out?: IVec4): IVec4 {
    out ||= { x: 0, y: 0, z: 0, w: 0 }
    out.x = this.r
    out.y = this.g
    out.z = this.b
    out.w = this.a
    return out
  }

  public toBytes(): [number, number, number, number] {
    return [this.R, this.G, this.B, this.A]
  }

  public toPackedRGBA(): number {
    return Color.packToRGBA(this)
  }
}
