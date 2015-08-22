module Glib.Content.Importer {

  import Graphics = Glib.Graphics;
  import debug = Glib.utils.debug;

  function readVertex(data, element) {
    var vertex:any = {};
    vertex.position = data.v[element[0] - 1];

    if (element[1] != null && data.vt != null) {
      vertex.texture = data.vt[element[1] - 1];
    }
    if (element[2] != null && data.vn != null) {
      vertex.normal = data.vn[element[2] - 1];
    }
    return vertex;
  }

  function readMesh(group, data) {
    var builder = Glib.Graphics.Geometry.Builder.create({
      layout: "PositionNormalTexture",
      ignoreTransform: true
    });
    var index = 0;
    for (var face of group.f) {
      var vertex = void 0;

      vertex = readVertex(data, face[0]);
      builder.addIndex(index);
      builder.addVertex(vertex);
      index += 1;

      vertex = readVertex(data, face[1]);
      builder.addIndex(index);
      builder.addVertex(vertex);
      index += 1;

      vertex = readVertex(data, face[2]);
      builder.addIndex(index);
      builder.addVertex(vertex);
      index += 1;

      if (face.length == 4) {
        vertex = readVertex(data, face[0]);
        builder.addIndex(index);
        builder.addVertex(vertex);
        index += 1;

        vertex = readVertex(data, face[2]);
        builder.addIndex(index);
        builder.addVertex(vertex);
        index += 1;

        vertex = readVertex(data, face[3]);
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

  function hasSameVertexCount(group) {
    if (!group.v) return true;
    var length = group.v.length;
    if (group.vt && group.vt.length !== length) return false;
    if (group.vn && group.vn.length !== length) return false;
    if (group.vp && group.vp.length !== length) return false;
    return true;
  }

  function hasSimpleLayout(obj){
    if (!hasSameVertexCount(obj)) {
      return false;
    }
    for(var group of obj.groups) {
      if (!hasSameVertexCount(group)) {
        return false;
      }
    }
    return true;
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
    debug('[ImportObjModel]', data);
    var obj = Parser.OBJ.parse(data.content);
    var json = convert(obj);
    return loadJsonModel(json, data, manager);
  }

  Manager.addImporter('obj', 'Model', importObjModel);
}
