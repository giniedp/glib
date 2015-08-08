module Glib.Graphics {
  function rgba(r:number, g:number, b:number, a:number):number {
    return (r | 0) << 24 | (g | 0) << 16 | (b | 0) << 8 | (a | 0) << 0;
  }

  function r(color:number):number {
    return (color >> 24) & 255;
  }

  function g(color:number):number {
    return (color >> 16) & 255;
  }

  function b(color:number):number {
    return (color >> 8) & 255;
  }

  function a(color:number):number {
    return (color >> 0) & 255;
  }

  function x(color:number):number {
    return r(color) / 255;
  }

  function y(color:number):number {
    return g(color) / 255;
  }

  function z(color:number):number {
    return b(color) / 255;
  }

  function w(color:number):number {
    return a(color) / 255;
  }

  export var Color = {
    rgba: rgba,
    r: r,
    g: g,
    b: b,
    a: a,
    x: x,
    y: y,
    z: z,
    w: w,
    AliceBlue: rgba(240, 248, 255, 255),
    AntiqueWhite: rgba(250, 235, 215, 255),
    Aqua: rgba(0, 255, 255, 255),
    Aquamarine: rgba(127, 255, 212, 255),
    Azure: rgba(240, 255, 255, 255),
    Beige: rgba(245, 245, 220, 255),
    Bisque: rgba(255, 228, 196, 255),
    Black: rgba(0, 0, 0, 255),
    BlanchedAlmond: rgba(255, 235, 205, 255),
    Blue: rgba(0, 0, 255, 255),
    BlueViolet: rgba(138, 43, 226, 255),
    Brown: rgba(165, 42, 42, 255),
    BurlyWood: rgba(222, 184, 135, 255),
    CadetBlue: rgba(95, 158, 160, 255),
    Chartreuse: rgba(127, 255, 0, 255),
    Chocolate: rgba(210, 105, 30, 255),
    Coral: rgba(255, 127, 80, 255),
    CornflowerBlue: rgba(100, 149, 237, 255),
    Cornsilk: rgba(255, 248, 220, 255),
    Crimson: rgba(220, 20, 60, 255),
    Cyan: rgba(0, 255, 255, 255),
    DarkBlue: rgba(0, 0, 139, 255),
    DarkCyan: rgba(0, 139, 139, 255),
    DarkGoldenrod: rgba(184, 134, 11, 255),
    DarkGray: rgba(169, 169, 169, 255),
    DarkGreen: rgba(0, 100, 0, 255),
    DarkKhaki: rgba(189, 183, 107, 255),
    DarkMagenta: rgba(139, 0, 139, 255),
    DarkOliveGreen: rgba(85, 107, 47, 255),
    DarkOrange: rgba(255, 140, 0, 255),
    DarkOrchid: rgba(153, 50, 204, 255),
    DarkRed: rgba(139, 0, 0, 255),
    DarkSalmon: rgba(233, 150, 122, 255),
    DarkSeaGreen: rgba(143, 188, 139, 255),
    DarkSlateBlue: rgba(72, 61, 139, 255),
    DarkSlateGray: rgba(47, 79, 79, 255),
    DarkTurquoise: rgba(0, 206, 209, 255),
    DarkViolet: rgba(148, 0, 211, 255),
    DeepPink: rgba(255, 20, 147, 255),
    DeepSkyBlue: rgba(0, 191, 255, 255),
    DimGray: rgba(105, 105, 105, 255),
    DodgerBlue: rgba(30, 144, 255, 255),
    Firebrick: rgba(178, 34, 34, 255),
    FloralWhite: rgba(255, 250, 240, 255),
    ForestGreen: rgba(34, 139, 34, 255),
    Fuchsia: rgba(255, 0, 255, 255),
    Gainsboro: rgba(220, 220, 220, 255),
    GhostWhite: rgba(248, 248, 255, 255),
    Gold: rgba(255, 215, 0, 255),
    Goldenrod: rgba(218, 165, 32, 255),
    Gray: rgba(128, 128, 128, 255),
    Green: rgba(0, 128, 0, 255),
    GreenYellow: rgba(173, 255, 47, 255),
    Honeydew: rgba(240, 255, 240, 255),
    HotPink: rgba(255, 105, 180, 255),
    IndianRed: rgba(205, 92, 92, 255),
    Indigo: rgba(75, 0, 130, 255),
    Ivory: rgba(255, 255, 240, 255),
    Khaki: rgba(240, 230, 140, 255),
    Lavender: rgba(230, 230, 250, 255),
    LavenderBlush: rgba(255, 240, 245, 255),
    LawnGreen: rgba(124, 252, 0, 255),
    LemonChiffon: rgba(255, 250, 205, 255),
    LightBlue: rgba(173, 216, 230, 255),
    LightCoral: rgba(240, 128, 128, 255),
    LightCyan: rgba(224, 255, 255, 255),
    LightGoldenrodYellow: rgba(250, 250, 210, 255),
    LightGray: rgba(211, 211, 211, 255),
    LightGreen: rgba(144, 238, 144, 255),
    LightPink: rgba(255, 182, 193, 255),
    LightSalmon: rgba(255, 160, 122, 255),
    LightSeaGreen: rgba(32, 178, 170, 255),
    LightSkyBlue: rgba(135, 206, 250, 255),
    LightSlateGray: rgba(119, 136, 153, 255),
    LightSteelBlue: rgba(176, 196, 222, 255),
    LightYellow: rgba(255, 255, 224, 255),
    Lime: rgba(0, 255, 0, 255),
    LimeGreen: rgba(50, 205, 50, 255),
    Linen: rgba(250, 240, 230, 255),
    Magenta: rgba(255, 0, 255, 255),
    Maroon: rgba(128, 0, 0, 255),
    MediumAquamarine: rgba(102, 205, 170, 255),
    MediumBlue: rgba(0, 0, 205, 255),
    MediumOrchid: rgba(186, 85, 211, 255),
    MediumPurple: rgba(147, 112, 219, 255),
    MediumSeaGreen: rgba(60, 179, 113, 255),
    MediumSlateBlue: rgba(123, 104, 238, 255),
    MediumSpringGreen: rgba(0, 250, 154, 255),
    MediumTurquoise: rgba(72, 209, 204, 255),
    MediumVioletRed: rgba(199, 21, 133, 255),
    MidnightBlue: rgba(25, 25, 112, 255),
    MintCream: rgba(245, 255, 250, 255),
    MistyRose: rgba(255, 228, 225, 255),
    Moccasin: rgba(255, 228, 181, 255),
    NavajoWhite: rgba(255, 222, 173, 255),
    Navy: rgba(0, 0, 128, 255),
    OldLace: rgba(253, 245, 230, 255),
    Olive: rgba(128, 128, 0, 255),
    OliveDrab: rgba(107, 142, 35, 255),
    Orange: rgba(255, 165, 0, 255),
    OrangeRed: rgba(255, 69, 0, 255),
    Orchid: rgba(218, 112, 214, 255),
    PaleGoldenrod: rgba(238, 232, 170, 255),
    PaleGreen: rgba(152, 251, 152, 255),
    PaleTurquoise: rgba(175, 238, 238, 255),
    PaleVioletRed: rgba(219, 112, 147, 255),
    PapayaWhip: rgba(255, 239, 213, 255),
    PeachPuff: rgba(255, 218, 185, 255),
    Peru: rgba(205, 133, 63, 255),
    Pink: rgba(255, 192, 203, 255),
    Plum: rgba(221, 160, 221, 255),
    PowderBlue: rgba(176, 224, 230, 255),
    Purple: rgba(128, 0, 128, 255),
    Red: rgba(255, 0, 0, 255),
    RosyBrown: rgba(188, 143, 143, 255),
    RoyalBlue: rgba(65, 105, 225, 255),
    SaddleBrown: rgba(139, 69, 19, 255),
    Salmon: rgba(250, 128, 114, 255),
    SandyBrown: rgba(244, 164, 96, 255),
    SeaGreen: rgba(46, 139, 87, 255),
    SeaShell: rgba(255, 245, 238, 255),
    Sienna: rgba(160, 82, 45, 255),
    Silver: rgba(192, 192, 192, 255),
    SkyBlue: rgba(135, 206, 235, 255),
    SlateBlue: rgba(106, 90, 205, 255),
    SlateGray: rgba(112, 128, 144, 255),
    Snow: rgba(255, 250, 250, 255),
    SpringGreen: rgba(0, 255, 127, 255),
    SteelBlue: rgba(70, 130, 180, 255),
    Tan: rgba(210, 180, 140, 255),
    Teal: rgba(0, 128, 128, 255),
    Thistle: rgba(216, 191, 216, 255),
    Tomato: rgba(255, 99, 71, 255),
    TransparentBlack: rgba(0, 0, 0, 0),
    TransparentWhite: rgba(255, 255, 255, 0),
    Turquoise: rgba(64, 224, 208, 255),
    Violet: rgba(238, 130, 238, 255),
    Wheat: rgba(245, 222, 179, 255),
    White: rgba(255, 255, 255, 255),
    WhiteSmoke: rgba(245, 245, 245, 255),
    Yellow: rgba(255, 255, 0, 255),
    YellowGreen: rgba(154, 205, 50, 255)
  };
}