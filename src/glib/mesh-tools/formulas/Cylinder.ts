module Glib.MeshTools.Formulas {

  import valueOrDefault = Glib.utils.valueOrDefault;

  export function Cylinder(builder:Builder, options:{
    height?:number,
    diameter?:number,
    steps?:number
  } = {}) {
    var diameter = valueOrDefault(options.diameter, 1);
    builder.append("Cone", {
      height: options.height,
      steps: options.steps,
      upperDiameter: diameter,
      lowerDiameter: diameter
    });
  }
}
