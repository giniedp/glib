module Glib.Content.Pipeline {

  import debug = Glib.utils.debug;

  importer('.mtl', 'Material', function(context:Context) {
    context.intermediate = Parser.MTL.parse(context.raw.content).map(convertMaterial)[0]
    return context.manager.process(context)
  })

  importer('.mtl', 'Material[]', function(context:Context) {
    context.intermediate = Parser.MTL.parse(context.raw.content).map(convertMaterial)
    return context.manager.process(context)
  })

  function convertMaterial(mtl:Content.Parser.MtlData) {
    var result:Glib.Graphics.ShaderEffectOptions = {
      name: mtl.name,
      parameters: {}
    };

    if (mtl.Ka) result.parameters.AmbientColor = mtl.Ka;
    if (mtl.Kd) result.parameters.DiffuseColor = mtl.Kd;
    if (mtl.Ks) result.parameters.SpecularColor = mtl.Ks;
    if (mtl.Ns) result.parameters.SpecularPower = mtl.Ns;
    //if (m.Ni) result.parameters.refraction = m.Ni;
    if (mtl.map_Ka) {
      result.parameters.AmbientMap = mtl.map_Ka.file;
      result.parameters.AmbientMapEnabled = true;
    }
    if (mtl.map_Kd) {
      result.parameters.DiffuseMap = mtl.map_Kd.file;
      result.parameters.DiffuseMapEnabled = true;
    }
    if (mtl.bump) {
      result.parameters.NormalMap = mtl.bump;
      result.parameters.NormalMapEnabled = true;
    }
    if (mtl.map_Ks) {
      result.parameters.SpecularTexture = mtl.map_Ks.file;
      result.parameters.SpecularMapEnabled = true;
    }
    if (mtl.map_d) {
      result.parameters.AlphaMap = mtl.map_d;
      result.parameters.AlphaMapEnabled = true;
    }
    if (mtl.disp) {
      result.parameters.DisplaceMap = mtl.disp;
      result.parameters.DisplaceMapEnabled = true;
    }
    if (mtl.refl) {
      result.parameters.ReflectionMap = mtl.refl;
      result.parameters.ReflectionMapEnabled = true;
    }
    if (mtl.d) {
      result.parameters.Alpha = mtl.d;
    }

    result['effect'] = "basicEffect"
    result.techniques = [{
      name: 'basicEffect',
      passes: [{
        name: 'basicEffect',
        blendState: mtl.d < 1 ? 'AlphaBlend' : 'Opaque'
      }]
    }]
    result.technique = mtl.illum == "0" ? "basic" : "pixelLighting"
    return result
  }
}
