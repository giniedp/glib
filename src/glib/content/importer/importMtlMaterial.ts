module Glib.Content.Importer {

  import debug = Glib.utils.debug;

  function convertMaterial(m:any) {
    var result:Glib.Graphics.MaterialOptions = {
      parameters: {}
    };

    if (m.Ka) result.parameters.ambient = m.Ka;
    if (m.Kd) result.parameters.diffuse = m.Kd;
    if (m.Ks) result.parameters.specular = m.Ks;
    if (m.Ns) result.parameters.specularPower = m.Ns;
    if (m.Ni) result.parameters.refraction = m.Ni;
    if (m.map_Ka) result.parameters.ambientTex = m.map_Ka.file;
    if (m.map_Kd) result.parameters.diffuseTex = m.map_Kd.file;
    if (m.map_Ks) result.parameters.specularTex = m.map_Ks.file;
    if (m.map_d) result.parameters.alphaTex = m.map_d;
    if (m.bump) result.parameters.normalTex = m.bump;
    if (m.disp) result.parameters.displaceTex = m.disp;
    if (m.refl) result.parameters.reflectionTex = m.refl;

    if (m.d) result.parameters.alpha = m.d;
    if (m.d == 1) {
      result.blendState = "Opaque";
    } else if (m.d > 0) {
      result.blendState = "AlphaBlend";
    }
    if (m.illum == "0") {
      result.effect = "/assets/shader/textured.yml"
    } else if (m.illum == "1") {
      result.effect = "/assets/shader/textured.yml"
    } else if (m.illum == "2") {
      result.effect = "/assets/shader/textured.yml"
    } else {
      result.effect = "/assets/shader/textured.yml"
    }
    return result;
  }

  export function importMtlMaterial(asset:AssetData, manager:Manager):IPromise {
    debug('[Manager] ImportMtlMaterial', asset);
    var json:any = Glib.Content.Parser.MTL.parse(asset.content).map(convertMaterial);
    return Importer.loadJsonMaterial(json, asset, manager);
  }

  Manager.addImporter('mtl', 'Material', importMtlMaterial);
}
