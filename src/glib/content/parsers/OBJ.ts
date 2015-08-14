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

  function readVector(item:string) {
    return item.split("/").map(readFloat);
  }

  function readVectorArray(item:string) {
    return item.split(" ").map(readVector);
  }

  export class OBJ {
    meta:any;
    groups:any[];
    group:any;
    lastKey:string;

    parse(data) {
      var lines = data.split(/\n/);
      this.meta = {};
      this.groups = [];
      this.lastKey = "";
      this.nextGroup();

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
        var match = line.match(/^(\w+)\s(.*)$/);
        if (!match) continue;
        var key = match[1];
        var value = match[2];
        var reader = this[`read_${key}_key`];
        if (reader) reader.apply(this, [value]);
        this.lastKey = key;
      }
      return this;
    }

    currentGroup(){
      return this.group;
    }

    nextGroup() {
      this.group = {};
      this.groups.push(this.group);
    }

    read_o_key(data:string) {
      this.meta.name = data;
    }

    read_g_key(data:string) {
      this.group.name = data;
    }

    read_s_key(data:string) {
      data = (data == "off" ? "0" : data);
      if (data != "0") {
        this.currentGroup().smoothGroup = parseInt(data);
      }
    }

    read_mg_key(data:string) {
      var param = data.split(" ");
      var c = this.currentGroup();
      c.mergeGroup = parseInt(param[0]);
      c.mergeDistance = parseInt(param[1]);
    }

    read_lod_key(data:string) {
      this.currentGroup().lod = parseInt(data);
    }

    read_maplib_key(data:string) {
      this.currentGroup().maplib = data.split(" ");
    }

    read_mtllib_key(data:string) {
      this.meta.materials = data.split(" ");
    }

    read_usemtl_key(data:string) {
      this.currentGroup().material = data;
    }

    read_v_key(data:string) {
      if (this.lastKey === 'f') {
        this.nextGroup();
      }
      var c = this.currentGroup();
      c.v = c.v || [];
      c.v.push(readFloatArray(data));
    }

    read_vt_key(data:string) {
      var c = this.currentGroup();
      c.vt = c.vt || [];
      c.vt.push(readFloatArray(data));
    }

    read_vn_key(data:string) {
      var c = this.currentGroup();
      c.vn = c.vn || [];
      c.vn.push(readFloatArray(data));
    }

    read_vp_key(data:string) {
      var c = this.currentGroup();
      c.vp = c.vp || [];
      c.vp.push(readVectorArray(data));
    }

    read_p_key(data:string) {
      var c = this.currentGroup();
      c.p = c.p || [];
      c.p.push(readVectorArray(data));
    }

    read_f_key(data:string) {
      var c = this.currentGroup();
      c.f = c.f || [];
      c.f.push(readVectorArray(data));
    }

    toGlibModel() {
      function readVertex(g, f, off=0) {
        var vertex:any = {};
        vertex.position = g.v[f[off][0] - 1];

        if (f[off][1] != null && g.vt != null) {
          vertex.texture = g.vt[f[off][1] - 1];
        }
        if (f[off][2] != null && g.vn != null) {
          vertex.normal = g.vn[f[off][2] - 1];
        }
        return vertex;
      }

      function readMesh(group) {
        var builder = new Glib.MeshTools.Builder({
          layout: "PositionNormalTexture"
        });
        var index = 0;
        for (var face of group.f) {
          var vertex = void 0;

          vertex = readVertex(group, face, 0);
          builder.addIndex(index);
          builder.addVertex(vertex);
          index += 1;

          vertex = readVertex(group,face, 1);
          builder.addIndex(index);
          builder.addVertex(vertex);
          index += 1;

          vertex = readVertex(group, face, 2);
          builder.addIndex(index);
          builder.addVertex(vertex);
          index += 1;

          if (face.length == 4) {
            vertex = readVertex(group, face, 0);
            builder.addIndex(index);
            builder.addVertex(vertex);
            index += 1;

            vertex = readVertex(group, face, 2);
            builder.addIndex(index);
            builder.addVertex(vertex);
            index += 1;

            vertex = readVertex(group, face, 3);
            builder.addIndex(index);
            builder.addVertex(vertex);
            index += 1;
          }
        }

        return {
          name: group.name,
          materialId: group.material,
          indexBuffer: builder.indexBuffer,
          vertexBuffer: builder.vertexBuffer,
        };
      }

      var meshes = [];
      for (var group of this.groups) {
        var mesh = readMesh(group);
        meshes.push(mesh);
      }

      return {
        materials: this.meta.materials,
        meshes: meshes
      };
    }
  }

  Manager.registerParser(".obj", parseObj);
  function parseObj(data){
    return new OBJ().parse(data).toGlibModel();
  }
}
