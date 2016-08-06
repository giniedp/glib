module Glib.Content.Importer {

  import Graphics = Glib.Graphics;
  import debug = Glib.utils.debug;

  import ObjGroup = Glib.Content.Parser.ObjGroup;
  import ObjData = Glib.Content.Parser.ObjData;
  
  var V = 0;
  var VT = 1;
  var VN = 2;
  
  function readVertex(data:ObjData, element) {
    var vertex:any = {};
    vertex.position = data.v[element[V] - 1];

    if (element[VT] != null && data.vt != null) {
      vertex.texture = data.vt[element[VT] - 1];
    }
    if (element[VN] != null && data.vn != null) {
      vertex.normal = data.vn[element[VN] - 1];
    }
    return vertex;
  }

  function buildMesh(builder:Graphics.Geometry.Builder, data:ObjData, groups:ObjGroup[]) {

    var index = 0;
    var vertex = void 0;
    for (var group of groups) {
      for (var face of group.f) {
        var count = 0;
        while (count < face.length - 2) {
          
          if (builder.vertexCount >= (builder.maxVertexCount - 2)) {
            builder.endMeshOptions({
              name: group.name,
              materialId: group.material
            });
            index = 0;
          }
          
          vertex = readVertex(data, face[0]);
          builder.addIndex(index);
          builder.addVertex(vertex);
          index += 1;

          vertex = readVertex(data, face[count + 2]);
          builder.addIndex(index);
          builder.addVertex(vertex);
          index += 1;

          vertex = readVertex(data, face[count + 1]);
          builder.addIndex(index);
          builder.addVertex(vertex);
          index += 1;

          count += 1;
        }
      }
    }

    if (index == 0) return;
    
    builder.endMeshOptions({
      name: group.name,
      materialId: group.material
    });
  }

  function convert(data:ObjData) {
    var builder = Glib.Graphics.Geometry.Builder.begin({
      layout: "PositionNormalTexture",
      ignoreTransform: true
    });

    var byMaterial = {};
    for (var group of data.groups) {
      byMaterial[group.material] = byMaterial[group.material] || [];
      byMaterial[group.material].push(group);
    }
    for (var key in byMaterial) {
      buildMesh(builder, data, byMaterial[key]);
    }

    return builder.finishModelOptions({
      name: data.name,
      materials: data.materials
    });
  }

  export function objToJson(data:AssetData) {
    var obj = Parser.OBJ.parse(data.content);
    var json = convert(obj);
    return json
  }
  Glib.WebWorker.register("objToJson", objToJson)
  export function objToJsonAsync(data:AssetData): IPromise {
    return Glib.WebWorker.execute("objToJson", data)
  }

  export function importObjModel(data:AssetData, manager:Manager) {
    return objToJsonAsync(data).then(function(json) {
      return loadJsonModel(json, data, manager)
    })
    /*
    //debug('[ImportObjModel]', data);
    var obj = Parser.OBJ.parse(data.content);
    var json = convert(obj);
    return loadJsonModel(json, data, manager);
    */
  }

  Manager.addImporter('obj', 'Model', importObjModel);
}
