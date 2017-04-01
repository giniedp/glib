module Glib {
  export class Color {
    constructor(public r: number=0, public g: number=0, public b: number=0, public a: number=0){

    }
    get rgba(): number{
      return (this.a | 0) << 24 | (this.b | 0) << 16 | (this.g | 0) << 8 | (this.r | 0) << 0
    }
    get argb(): number{
      return (this.b | 0) << 24 | (this.g | 0) << 16 | (this.r | 0) << 8 | (this.a | 0) << 0
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

    get clone():Color {
      return new Color(this.r, this.g, this.b, this.a)
    }

    static create(r: number, g: number, b: number, a: number):Color {
      return new Color(r, g, b, a)
    }

    static fromRgba(rgba: number):Color {
      return new Color(this.r(rgba), this.g(rgba), this.b(rgba), this.a(rgba))
    }

    static rgba(r: number, g: number, b: number, a: number): number {
      return (a | 0) << 24 | (b | 0) << 16 | (g | 0) << 8 | (r | 0) << 0
    }

    static r(rgba: number): number {
      return rgba & 255
    }

    static g(rgba: number): number {
      return (rgba >> 8) & 255
    }

    static b(rgba: number): number {
      return (rgba >> 16) & 255
    }

    static a(rgba: number): number {
      return (rgba >> 24) & 255
    }

    static x(rgba: number): number {
      return this.r(rgba) / 255
    }

    static y(rgba: number): number {
      return this.g(rgba) / 255
    }

    static z(rgba: number): number {
      return this.b(rgba) / 255
    }

    static w(rgba: number): number {
      return this.a(rgba) / 255
    }

    static AliceBlue = Color.create(240, 248, 255, 255)
    static AntiqueWhite = Color.create(250, 235, 215, 255)
    static Aqua = Color.create(0, 255, 255, 255)
    static Aquamarine = Color.create(127, 255, 212, 255)
    static Azure = Color.create(240, 255, 255, 255)
    static Beige = Color.create(245, 245, 220, 255)
    static Bisque = Color.create(255, 228, 196, 255)
    static Black = Color.create(0, 0, 0, 255)
    static BlanchedAlmond = Color.create(255, 235, 205, 255)
    static Blue = Color.create(0, 0, 255, 255)
    static BlueViolet = Color.create(138, 43, 226, 255)
    static Brown = Color.create(165, 42, 42, 255)
    static BurlyWood = Color.create(222, 184, 135, 255)
    static CadetBlue = Color.create(95, 158, 160, 255)
    static Chartreuse = Color.create(127, 255, 0, 255)
    static Chocolate = Color.create(210, 105, 30, 255)
    static Coral = Color.create(255, 127, 80, 255)
    static CornflowerBlue = Color.create(100, 149, 237, 255)
    static Cornsilk = Color.create(255, 248, 220, 255)
    static Crimson = Color.create(220, 20, 60, 255)
    static Cyan = Color.create(0, 255, 255, 255)
    static DarkBlue = Color.create(0, 0, 139, 255)
    static DarkCyan = Color.create(0, 139, 139, 255)
    static DarkGoldenrod = Color.create(184, 134, 11, 255)
    static DarkGray = Color.create(169, 169, 169, 255)
    static DarkGreen = Color.create(0, 100, 0, 255)
    static DarkKhaki = Color.create(189, 183, 107, 255)
    static DarkMagenta = Color.create(139, 0, 139, 255)
    static DarkOliveGreen = Color.create(85, 107, 47, 255)
    static DarkOrange = Color.create(255, 140, 0, 255)
    static DarkOrchid = Color.create(153, 50, 204, 255)
    static DarkRed = Color.create(139, 0, 0, 255)
    static DarkSalmon = Color.create(233, 150, 122, 255)
    static DarkSeaGreen = Color.create(143, 188, 139, 255)
    static DarkSlateBlue = Color.create(72, 61, 139, 255)
    static DarkSlateGray = Color.create(47, 79, 79, 255)
    static DarkTurquoise = Color.create(0, 206, 209, 255)
    static DarkViolet = Color.create(148, 0, 211, 255)
    static DeepPink = Color.create(255, 20, 147, 255)
    static DeepSkyBlue = Color.create(0, 191, 255, 255)
    static DimGray = Color.create(105, 105, 105, 255)
    static DodgerBlue = Color.create(30, 144, 255, 255)
    static Firebrick = Color.create(178, 34, 34, 255)
    static FloralWhite = Color.create(255, 250, 240, 255)
    static ForestGreen = Color.create(34, 139, 34, 255)
    static Fuchsia = Color.create(255, 0, 255, 255)
    static Gainsboro = Color.create(220, 220, 220, 255)
    static GhostWhite = Color.create(248, 248, 255, 255)
    static Gold = Color.create(255, 215, 0, 255)
    static Goldenrod = Color.create(218, 165, 32, 255)
    static Gray = Color.create(128, 128, 128, 255)
    static Green = Color.create(0, 128, 0, 255)
    static GreenYellow = Color.create(173, 255, 47, 255)
    static Honeydew = Color.create(240, 255, 240, 255)
    static HotPink = Color.create(255, 105, 180, 255)
    static IndianRed = Color.create(205, 92, 92, 255)
    static Indigo = Color.create(75, 0, 130, 255)
    static Ivory = Color.create(255, 255, 240, 255)
    static Khaki = Color.create(240, 230, 140, 255)
    static Lavender = Color.create(230, 230, 250, 255)
    static LavenderBlush = Color.create(255, 240, 245, 255)
    static LawnGreen = Color.create(124, 252, 0, 255)
    static LemonChiffon = Color.create(255, 250, 205, 255)
    static LightBlue = Color.create(173, 216, 230, 255)
    static LightCoral = Color.create(240, 128, 128, 255)
    static LightCyan = Color.create(224, 255, 255, 255)
    static LightGoldenrodYellow = Color.create(250, 250, 210, 255)
    static LightGray = Color.create(211, 211, 211, 255)
    static LightGreen = Color.create(144, 238, 144, 255)
    static LightPink = Color.create(255, 182, 193, 255)
    static LightSalmon = Color.create(255, 160, 122, 255)
    static LightSeaGreen = Color.create(32, 178, 170, 255)
    static LightSkyBlue = Color.create(135, 206, 250, 255)
    static LightSlateGray = Color.create(119, 136, 153, 255)
    static LightSteelBlue = Color.create(176, 196, 222, 255)
    static LightYellow = Color.create(255, 255, 224, 255)
    static Lime = Color.create(0, 255, 0, 255)
    static LimeGreen = Color.create(50, 205, 50, 255)
    static Linen = Color.create(250, 240, 230, 255)
    static Magenta = Color.create(255, 0, 255, 255)
    static Maroon = Color.create(128, 0, 0, 255)
    static MediumAquamarine = Color.create(102, 205, 170, 255)
    static MediumBlue = Color.create(0, 0, 205, 255)
    static MediumOrchid = Color.create(186, 85, 211, 255)
    static MediumPurple = Color.create(147, 112, 219, 255)
    static MediumSeaGreen = Color.create(60, 179, 113, 255)
    static MediumSlateBlue = Color.create(123, 104, 238, 255)
    static MediumSpringGreen = Color.create(0, 250, 154, 255)
    static MediumTurquoise = Color.create(72, 209, 204, 255)
    static MediumVioletRed = Color.create(199, 21, 133, 255)
    static MidnightBlue = Color.create(25, 25, 112, 255)
    static MintCream = Color.create(245, 255, 250, 255)
    static MistyRose = Color.create(255, 228, 225, 255)
    static Moccasin = Color.create(255, 228, 181, 255)
    static NavajoWhite = Color.create(255, 222, 173, 255)
    static Navy = Color.create(0, 0, 128, 255)
    static OldLace = Color.create(253, 245, 230, 255)
    static Olive = Color.create(128, 128, 0, 255)
    static OliveDrab = Color.create(107, 142, 35, 255)
    static Orange = Color.create(255, 165, 0, 255)
    static OrangeRed = Color.create(255, 69, 0, 255)
    static Orchid = Color.create(218, 112, 214, 255)
    static PaleGoldenrod = Color.create(238, 232, 170, 255)
    static PaleGreen = Color.create(152, 251, 152, 255)
    static PaleTurquoise = Color.create(175, 238, 238, 255)
    static PaleVioletRed = Color.create(219, 112, 147, 255)
    static PapayaWhip = Color.create(255, 239, 213, 255)
    static PeachPuff = Color.create(255, 218, 185, 255)
    static Peru = Color.create(205, 133, 63, 255)
    static Pink = Color.create(255, 192, 203, 255)
    static Plum = Color.create(221, 160, 221, 255)
    static PowderBlue = Color.create(176, 224, 230, 255)
    static Purple = Color.create(128, 0, 128, 255)
    static Red = Color.create(255, 0, 0, 255)
    static RosyBrown = Color.create(188, 143, 143, 255)
    static RoyalBlue = Color.create(65, 105, 225, 255)
    static SaddleBrown = Color.create(139, 69, 19, 255)
    static Salmon = Color.create(250, 128, 114, 255)
    static SandyBrown = Color.create(244, 164, 96, 255)
    static SeaGreen = Color.create(46, 139, 87, 255)
    static SeaShell = Color.create(255, 245, 238, 255)
    static Sienna = Color.create(160, 82, 45, 255)
    static Silver = Color.create(192, 192, 192, 255)
    static SkyBlue = Color.create(135, 206, 235, 255)
    static SlateBlue = Color.create(106, 90, 205, 255)
    static SlateGray = Color.create(112, 128, 144, 255)
    static Snow = Color.create(255, 250, 250, 255)
    static SpringGreen = Color.create(0, 255, 127, 255)
    static SteelBlue = Color.create(70, 130, 180, 255)
    static Tan = Color.create(210, 180, 140, 255)
    static Teal = Color.create(0, 128, 128, 255)
    static Thistle = Color.create(216, 191, 216, 255)
    static Tomato = Color.create(255, 99, 71, 255)
    static TransparentBlack = Color.create(0, 0, 0, 0)
    static TransparentWhite = Color.create(255, 255, 255, 0)
    static Turquoise = Color.create(64, 224, 208, 255)
    static Violet = Color.create(238, 130, 238, 255)
    static Wheat = Color.create(245, 222, 179, 255)
    static White = Color.create(255, 255, 255, 255)
    static WhiteSmoke = Color.create(245, 245, 245, 255)
    static Yellow = Color.create(255, 255, 0, 255)
    static YellowGreen = Color.create(154, 205, 50, 255)
  }
}
