import { IVec4, Vec4 } from '@gglib/math'

// tslint:disable no-bitwise

/**
 * RGBA formatted color parser
 *
 * @public
 */
export const RGBA_FORMAT = Object.freeze({
  r: (rgba: number): number => (rgba >> 0) & 255,
  g: (rgba: number): number => (rgba >> 8) & 255,
  b: (rgba: number): number => (rgba >> 16) & 255,
  a: (rgba: number): number => (rgba >> 24) & 255,

  x: (rgba: number): number => ((rgba >> 0) & 255) / 255,
  y: (rgba: number): number => ((rgba >> 8) & 255) / 255,
  z: (rgba: number): number => ((rgba >> 16) & 255) / 255,
  w: (rgba: number): number => ((rgba >> 24) & 255) / 255,
})

/**
 * ARGB formatted color parser
 *
 * @public
 */
export const ABGR_FORMAT = Object.freeze({
  a: (argb: number): number => (argb >> 0) & 255,
  b: (argb: number): number => (argb >> 8) & 255,
  g: (argb: number): number => (argb >> 16) & 255,
  r: (argb: number): number => (argb >> 24) & 255,

  x: (argb: number): number => ((argb >> 0) & 255) / 255,
  y: (argb: number): number => ((argb >> 8) & 255) / 255,
  z: (argb: number): number => ((argb >> 16) & 255) / 255,
  w: (argb: number): number => ((argb >> 24) & 255) / 255,
})

/**
 * @public
 */
export class Color {

  public static create(r: number, g: number, b: number, a: number): Color {
    return new Color(r, g, b, a)
  }

  public static fromRgba(rgba: number): Color {
    return new Color(
      RGBA_FORMAT.r(rgba),
      RGBA_FORMAT.g(rgba),
      RGBA_FORMAT.b(rgba),
      RGBA_FORMAT.a(rgba),
    )
  }

  public static fromRgbaHex(rgba: string): Color {
    const abgr = parseInt(rgba.match(/[0-9a-f]+/i)[0], 16)
    // rgba hex string has abgr byte order when it is parsed
    return new Color(
      ABGR_FORMAT.r(abgr),
      ABGR_FORMAT.g(abgr),
      ABGR_FORMAT.b(abgr),
      ABGR_FORMAT.a(abgr),
    )
  }

  public static rgba(r: number, g: number, b: number, a: number): number {
    return (a | 0) << 24 | (b | 0) << 16 | (g | 0) << 8 | (r | 0) << 0
  }

  public static xyzw(x: number, y: number, z: number, w: number) {
    return Color.rgba(x * 255, y * 255, z * 255, w * 255)
  }

  // public static r(rgba: number): number {
  //   return rgba & 255
  // }

  // public static g(rgba: number): number {
  //   return (rgba >> 8) & 255
  // }

  // public static b(rgba: number): number {
  //   return (rgba >> 16) & 255
  // }

  // public static a(rgba: number): number {
  //   return (rgba >> 24) & 255
  // }

  // public static x(rgba: number): number {
  //   return this.r(rgba) / 255
  // }

  // public static y(rgba: number): number {
  //   return this.g(rgba) / 255
  // }

  // public static z(rgba: number): number {
  //   return this.b(rgba) / 255
  // }

  // public static w(rgba: number): number {
  //   return this.a(rgba) / 255
  // }

  public static AliceBlue = Color.create(240, 248, 255, 255)
  public static AntiqueWhite = Color.create(250, 235, 215, 255)
  public static Aqua = Color.create(0, 255, 255, 255)
  public static Aquamarine = Color.create(127, 255, 212, 255)
  public static Azure = Color.create(240, 255, 255, 255)
  public static Beige = Color.create(245, 245, 220, 255)
  public static Bisque = Color.create(255, 228, 196, 255)
  public static Black = Color.create(0, 0, 0, 255)
  public static BlanchedAlmond = Color.create(255, 235, 205, 255)
  public static Blue = Color.create(0, 0, 255, 255)
  public static BlueViolet = Color.create(138, 43, 226, 255)
  public static Brown = Color.create(165, 42, 42, 255)
  public static BurlyWood = Color.create(222, 184, 135, 255)
  public static CadetBlue = Color.create(95, 158, 160, 255)
  public static Chartreuse = Color.create(127, 255, 0, 255)
  public static Chocolate = Color.create(210, 105, 30, 255)
  public static Coral = Color.create(255, 127, 80, 255)
  public static CornflowerBlue = Color.create(100, 149, 237, 255)
  public static Cornsilk = Color.create(255, 248, 220, 255)
  public static Crimson = Color.create(220, 20, 60, 255)
  public static Cyan = Color.create(0, 255, 255, 255)
  public static DarkBlue = Color.create(0, 0, 139, 255)
  public static DarkCyan = Color.create(0, 139, 139, 255)
  public static DarkGoldenrod = Color.create(184, 134, 11, 255)
  public static DarkGray = Color.create(169, 169, 169, 255)
  public static DarkGreen = Color.create(0, 100, 0, 255)
  public static DarkKhaki = Color.create(189, 183, 107, 255)
  public static DarkMagenta = Color.create(139, 0, 139, 255)
  public static DarkOliveGreen = Color.create(85, 107, 47, 255)
  public static DarkOrange = Color.create(255, 140, 0, 255)
  public static DarkOrchid = Color.create(153, 50, 204, 255)
  public static DarkRed = Color.create(139, 0, 0, 255)
  public static DarkSalmon = Color.create(233, 150, 122, 255)
  public static DarkSeaGreen = Color.create(143, 188, 139, 255)
  public static DarkSlateBlue = Color.create(72, 61, 139, 255)
  public static DarkSlateGray = Color.create(47, 79, 79, 255)
  public static DarkTurquoise = Color.create(0, 206, 209, 255)
  public static DarkViolet = Color.create(148, 0, 211, 255)
  public static DeepPink = Color.create(255, 20, 147, 255)
  public static DeepSkyBlue = Color.create(0, 191, 255, 255)
  public static DimGray = Color.create(105, 105, 105, 255)
  public static DodgerBlue = Color.create(30, 144, 255, 255)
  public static Firebrick = Color.create(178, 34, 34, 255)
  public static FloralWhite = Color.create(255, 250, 240, 255)
  public static ForestGreen = Color.create(34, 139, 34, 255)
  public static Fuchsia = Color.create(255, 0, 255, 255)
  public static Gainsboro = Color.create(220, 220, 220, 255)
  public static GhostWhite = Color.create(248, 248, 255, 255)
  public static Gold = Color.create(255, 215, 0, 255)
  public static Goldenrod = Color.create(218, 165, 32, 255)
  public static Gray = Color.create(128, 128, 128, 255)
  public static Green = Color.create(0, 128, 0, 255)
  public static GreenYellow = Color.create(173, 255, 47, 255)
  public static Honeydew = Color.create(240, 255, 240, 255)
  public static HotPink = Color.create(255, 105, 180, 255)
  public static IndianRed = Color.create(205, 92, 92, 255)
  public static Indigo = Color.create(75, 0, 130, 255)
  public static Ivory = Color.create(255, 255, 240, 255)
  public static Khaki = Color.create(240, 230, 140, 255)
  public static Lavender = Color.create(230, 230, 250, 255)
  public static LavenderBlush = Color.create(255, 240, 245, 255)
  public static LawnGreen = Color.create(124, 252, 0, 255)
  public static LemonChiffon = Color.create(255, 250, 205, 255)
  public static LightBlue = Color.create(173, 216, 230, 255)
  public static LightCoral = Color.create(240, 128, 128, 255)
  public static LightCyan = Color.create(224, 255, 255, 255)
  public static LightGoldenrodYellow = Color.create(250, 250, 210, 255)
  public static LightGray = Color.create(211, 211, 211, 255)
  public static LightGreen = Color.create(144, 238, 144, 255)
  public static LightPink = Color.create(255, 182, 193, 255)
  public static LightSalmon = Color.create(255, 160, 122, 255)
  public static LightSeaGreen = Color.create(32, 178, 170, 255)
  public static LightSkyBlue = Color.create(135, 206, 250, 255)
  public static LightSlateGray = Color.create(119, 136, 153, 255)
  public static LightSteelBlue = Color.create(176, 196, 222, 255)
  public static LightYellow = Color.create(255, 255, 224, 255)
  public static Lime = Color.create(0, 255, 0, 255)
  public static LimeGreen = Color.create(50, 205, 50, 255)
  public static Linen = Color.create(250, 240, 230, 255)
  public static Magenta = Color.create(255, 0, 255, 255)
  public static Maroon = Color.create(128, 0, 0, 255)
  public static MediumAquamarine = Color.create(102, 205, 170, 255)
  public static MediumBlue = Color.create(0, 0, 205, 255)
  public static MediumOrchid = Color.create(186, 85, 211, 255)
  public static MediumPurple = Color.create(147, 112, 219, 255)
  public static MediumSeaGreen = Color.create(60, 179, 113, 255)
  public static MediumSlateBlue = Color.create(123, 104, 238, 255)
  public static MediumSpringGreen = Color.create(0, 250, 154, 255)
  public static MediumTurquoise = Color.create(72, 209, 204, 255)
  public static MediumVioletRed = Color.create(199, 21, 133, 255)
  public static MidnightBlue = Color.create(25, 25, 112, 255)
  public static MintCream = Color.create(245, 255, 250, 255)
  public static MistyRose = Color.create(255, 228, 225, 255)
  public static Moccasin = Color.create(255, 228, 181, 255)
  public static NavajoWhite = Color.create(255, 222, 173, 255)
  public static Navy = Color.create(0, 0, 128, 255)
  public static OldLace = Color.create(253, 245, 230, 255)
  public static Olive = Color.create(128, 128, 0, 255)
  public static OliveDrab = Color.create(107, 142, 35, 255)
  public static Orange = Color.create(255, 165, 0, 255)
  public static OrangeRed = Color.create(255, 69, 0, 255)
  public static Orchid = Color.create(218, 112, 214, 255)
  public static PaleGoldenrod = Color.create(238, 232, 170, 255)
  public static PaleGreen = Color.create(152, 251, 152, 255)
  public static PaleTurquoise = Color.create(175, 238, 238, 255)
  public static PaleVioletRed = Color.create(219, 112, 147, 255)
  public static PapayaWhip = Color.create(255, 239, 213, 255)
  public static PeachPuff = Color.create(255, 218, 185, 255)
  public static Peru = Color.create(205, 133, 63, 255)
  public static Pink = Color.create(255, 192, 203, 255)
  public static Plum = Color.create(221, 160, 221, 255)
  public static PowderBlue = Color.create(176, 224, 230, 255)
  public static Purple = Color.create(128, 0, 128, 255)
  public static Red = Color.create(255, 0, 0, 255)
  public static RosyBrown = Color.create(188, 143, 143, 255)
  public static RoyalBlue = Color.create(65, 105, 225, 255)
  public static SaddleBrown = Color.create(139, 69, 19, 255)
  public static Salmon = Color.create(250, 128, 114, 255)
  public static SandyBrown = Color.create(244, 164, 96, 255)
  public static SeaGreen = Color.create(46, 139, 87, 255)
  public static SeaShell = Color.create(255, 245, 238, 255)
  public static Sienna = Color.create(160, 82, 45, 255)
  public static Silver = Color.create(192, 192, 192, 255)
  public static SkyBlue = Color.create(135, 206, 235, 255)
  public static SlateBlue = Color.create(106, 90, 205, 255)
  public static SlateGray = Color.create(112, 128, 144, 255)
  public static Snow = Color.create(255, 250, 250, 255)
  public static SpringGreen = Color.create(0, 255, 127, 255)
  public static SteelBlue = Color.create(70, 130, 180, 255)
  public static Tan = Color.create(210, 180, 140, 255)
  public static Teal = Color.create(0, 128, 128, 255)
  public static Thistle = Color.create(216, 191, 216, 255)
  public static Tomato = Color.create(255, 99, 71, 255)
  public static TransparentBlack = Color.create(0, 0, 0, 0)
  public static TransparentWhite = Color.create(255, 255, 255, 0)
  public static Turquoise = Color.create(64, 224, 208, 255)
  public static Violet = Color.create(238, 130, 238, 255)
  public static Wheat = Color.create(245, 222, 179, 255)
  public static White = Color.create(255, 255, 255, 255)
  public static WhiteSmoke = Color.create(245, 245, 245, 255)
  public static Yellow = Color.create(255, 255, 0, 255)
  public static YellowGreen = Color.create(154, 205, 50, 255)

  constructor(
    public r: number= 0,
    public g: number= 0,
    public b: number= 0,
    public a: number= 0,
  ) { }

  get rgba(): number {
    return (this.a | 0) << 24 | (this.b | 0) << 16 | (this.g | 0) << 8 | (this.r | 0) << 0
  }
  get argb(): number {
    return (this.b | 0) << 24 | (this.g | 0) << 16 | (this.r | 0) << 8 | (this.a | 0) << 0
  }
  get xyzw(): number[] {
    return Vec4.toArray(this)
  }

  get x(): number {
    return this.r / 255
  }

  get y(): number {
    return this.g / 255
  }

  get z(): number {
    return this.b / 255
  }

  get w(): number {
    return this.a / 255
  }

  get clone(): Color {
    return new Color(this.r, this.g, this.b, this.a)
  }
}
