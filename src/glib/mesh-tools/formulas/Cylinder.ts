module Glib.MeshTools.Formulas {

  import valueOrDefault = Glib.utils.valueOrDefault;

  function withDefault(opt, value) {
    return opt == null ? value : opt;
  }

  export function Cylinder(builder:Builder, options:{
    height?:number
    diameter?:number
    radius?:number
    steps?:number
  } = {}) {
    var radius = withDefault(options.radius, withDefault(options.diameter, 1) * 0.5);
    builder.append("Cone", {
      height: options.height,
      steps: options.steps,
      topRadius: radius,
      bottomRadius: radius
    });
  }
}
