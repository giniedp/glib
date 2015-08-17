module Glib.Content.Importer {

  import Graphics = Glib.Graphics;
  import debug = Glib.utils.debug;

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

  function readMesh(group, meta) {
    var builder = new Glib.MeshTools.Builder({
      layout: "PositionNormalTexture"
    });
    var index = 0;
    for (var face of group.f) {
      var vertex = void 0;

      vertex = readVertex(meta, face, 0);
      builder.addIndex(index);
      builder.addVertex(vertex);
      index += 1;

      vertex = readVertex(meta,face, 1);
      builder.addIndex(index);
      builder.addVertex(vertex);
      index += 1;

      vertex = readVertex(meta, face, 2);
      builder.addIndex(index);
      builder.addVertex(vertex);
      index += 1;

      if (face.length == 4) {
        vertex = readVertex(meta, face, 0);
        builder.addIndex(index);
        builder.addVertex(vertex);
        index += 1;

        vertex = readVertex(meta, face, 2);
        builder.addIndex(index);
        builder.addVertex(vertex);
        index += 1;

        vertex = readVertex(meta, face, 3);
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

  function convert(obj) {
    var meshes = [];
    for (var group of obj.groups) {
      var mesh = readMesh(group, obj);
      meshes.push(mesh);
    }

    return {
      materials: obj.materials,
      meshes: meshes
    };
  }

  export function importObjModel(data:AssetData, manager:Manager) {
    debug('[Manager] ImportObjModel', arguments);
    var obj = Parser.OBJ.parse(data.content);
    var json = convert(obj);
    return loadJsonModel(json, data, manager);
  }

  Manager.addImporter('obj', 'Model', importObjModel);
}
