module Glib.Content.Pipeline {

  importer('.obj', 'Model', function (context:Context) {
    return objToJsonAsync(context.raw).then(function(json) {
      context.intermediate = json
      return context.manager.process(context)
    })
  })

  function objToJson(data:RawAsset) {
    let obj = Parser.OBJ.parse(data.content);
    let json = convert(obj);
    return json
  }
  
  Glib.WebWorker.register("objToJson", objToJson)
  function objToJsonAsync(data:RawAsset): IPromise {
    return Glib.WebWorker.execute("objToJson", data)
  }

  function convert(data:ObjData) {
    let builder = Glib.Graphics.Geometry.Builder.begin({
      layout: "PositionTextureNormalTangentBitangent",
      ignoreTransform: true
    });

    let byMaterial = {};
    for (let group of data.groups) {
      byMaterial[group.material] = byMaterial[group.material] || [];
      byMaterial[group.material].push(group);
    }
    for (let key in byMaterial) {
      buildMesh(builder, data, byMaterial[key]);
    }

    return builder.finishModelOptions({
      name: data.name,
      materials: data.materials
    });
  }
  
  import ObjGroup = Glib.Content.Parser.ObjGroup;
  import ObjData = Glib.Content.Parser.ObjData;
  
  let V = 0;
  let VT = 1;
  let VN = 2;
  
  function readVertex(data:ObjData, element) {
    let vertex:any = {};
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

    let index = 0;
    let vertex = void 0;
    for (let group of groups) {
      for (let face of group.f) {
        let count = 0;
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
}
