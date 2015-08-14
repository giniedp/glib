module Glib.Content.Parsers {

  function readFloat(item:string) {
    if (item) {
      return parseFloat(item);
    }
    return void 0;
  }

  function readFloatArray(item:string) {
    return item.split(" ").map(readFloat);
  }

  export class MTL {
    result:any;
    material:any;

    parse(data) {
      var lines = data.split(/\n/);
      this.result = [];
      this.material = void 0;

      var currentLine = "";
      for (var line of lines) {
        // remove comments
        var cIndex = line.indexOf("#");
        if (cIndex >= 0){
          line = line.substr(0, cIndex);
        }

        // trim whitespaces
        line = line.replace(/\s+/g, ' ').trim();

        // skip blank lines
        if (!line) continue;

        // join multi line strings
        if (line.match(/\\$/)) {
          currentLine = currentLine + line.replace(/\\$/, '');
          continue;
        } else if (currentLine) {
          line = currentLine + line;
          currentLine = "";
        }

        // parse line
        var match = line.match(/^(\w+)\s+(.*)$/);
        if (!match) continue;
        var key = match[1];
        var value = match[2];
        var reader = this[`read_${key}_key`];
        if (reader) reader.apply(this, [value]);
      }
      return this;
    }

    read_newmtl_key(data:string) {
      this.material = {
        name: data
      };
      this.result.push(this.material);
    }

    read_d_key(data:string) {
      this.material.Tr = readFloat(data);
    }
    read_Tr_key(data:string) {
      this.material.Tr = readFloat(data);
    }
    read_Ka_key(data:string) {
      this.material.Ka = readFloatArray(data);
    }
    read_Kd_key(data:string) {
      this.material.Kd = readFloatArray(data);
    }
    read_Ks_key(data:string) {
      this.material.Ks = readFloatArray(data);
    }
    read_Ns_key(data:string) {
      this.material.Ns = readFloat(data);
    }
    read_illum_key(data:string) {
      // 0 This is a constant color illumination model. The color is the specified Kd for the material. The formula is:
      //   color = Kd
      // 1 This is a diffuse illumination model using Lambertian shading. The color includes an ambient and diffuse shading terms for each light source. The formula is
      // color = KaIa + Kd { SUM j=1..ls, (N * Lj)Ij }
      // 2 This is a diffuse and specular illumination model using Lambertian shading and Blinn's interpretation of Phong's specular illumination model (BLIN77).
      //   The color includes an ambient constant term, and a diffuse and specular shading term for each light source. The formula is:
      //   color = KaIa + Kd { SUM j=1..ls, (N*Lj)Ij } + Ks { SUM j=1..ls, ((H*Hj)^Ns)Ij }
      // Term definitions are: Ia ambient light, Ij light j's intensity, Ka ambient reflectance, Kd diffuse reflectance, Ks specular reflectance, H unit vector bisector between L and V, L unit light vector, N unit surface normal, V unit view vector
      this.material.illum = data;
    }
    read_map_Ka_key(data:string) {
      this.material.map_Ka = data;
    }
    read_map_Kd_key(data:string) {
      this.material.map_Kd = data;
    }
    read_map_Ks_key(data:string) {
      this.material.map_Ks = data;
    }

    toGlibMaterial() {
      function convertMatrial(m) {
        var result:Glib.Graphics.MaterialOptions = {
          parameters: {}
        };

        if (m.Ka) result.parameters.ambient = m.Ka;
        if (m.Kd) result.parameters.diffuse = m.Kd;
        if (m.Ks) result.parameters.specular = m.Ks;
        if (m.Ns) result.parameters.specularPower = m.Ns;
        if (m.map_Ka) result.parameters.ambientTex = m.map_Ka;
        if (m.map_Kd) result.parameters.diffuseTex = m.map_Kd;
        if (m.map_Ks) result.parameters.specularTex = m.map_Ks;
        if (m.Tr) result.parameters.alpha = m.Tr;
        if (m.Tr == 1) {
          result.blendState = "Opaque";
        } else if (m.Tr > 0) {
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
      return this.result.map(function(m){
        return convertMatrial(m);
      });
    }
  }

  Manager.registerParser(".mtl", parseMtl);
  function parseMtl(content){
    return new MTL().parse(content).toGlibMaterial();
  }
}
