module Glib.Content.Importer {

  import debug = Glib.utils.debug;

  function convertMaterial(m:Content.Parser.MtlData, manager:Manager) {
    var result:Glib.Graphics.ShaderMaterialOptions = {
      name: m.name,
      parameters: {}
    };

    if (m.Ka) result.parameters.AmbientColor = m.Ka;
    if (m.Kd) result.parameters.DiffuseColor = m.Kd;
    if (m.Ks) result.parameters.SpecularColor = m.Ks;
    if (m.Ns) result.parameters.SpecularPower = m.Ns;
    //if (m.Ni) result.parameters.refraction = m.Ni;
    if (m.map_Ka) {
      result.parameters.AmbientMap = m.map_Ka.file;
      result.parameters.AmbientMapEnabled = true;
    }
    if (m.map_Kd) {
      result.parameters.DiffuseMap = m.map_Kd.file;
      result.parameters.DiffuseMapEnabled = true;
    }
    if (m.bump) {
      result.parameters.NormalMap = m.bump;
      result.parameters.NormalMapEnabled = true;
    }
    if (m.map_Ks) {
      result.parameters.SpecularTexture = m.map_Ks.file;
      result.parameters.SpecularMapEnabled = true;
    }
    if (m.map_d) {
      result.parameters.AlphaMap = m.map_d;
      result.parameters.AlphaMapEnabled = true;
    }
    if (m.disp) {
      result.parameters.DisplaceMap = m.disp;
      result.parameters.DisplaceMapEnabled = true;
    }
    if (m.refl) {
      result.parameters.ReflectionMap = m.refl;
      result.parameters.ReflectionMapEnabled = true;
    }

    if (m.d) result.parameters.alpha = m.d;
    if (m.d == 1) {
      result.blendState = "Opaque";
    } else if (m.d > 0) {
      result.blendState = "AlphaBlend";
    }
    
    result['effect'] = "basicEffect"
    //result.effect = "/assets/shader/basic.glfx"
    /*
    if (m.illum == "0") {
      result.technique = "basic"
    } else {
      result.technique = "pixelLighting"
    }
    */
    result.technique = "pixelLighting"
    return result;
  }

  export function importMtlMaterial(asset:AssetData, manager:Manager):IPromise {
    //debug('[ImportMtlMaterial]', asset);
    var json:any = Parser.MTL.parse(asset.content).map(function(material) {
      return convertMaterial(material, manager)
    });
    return Importer.loadJsonMaterial(json, asset, manager);
  }

  Manager.addImporter('mtl', 'Material', importMtlMaterial);
}
