module Glib.MeshTools {

  import Vec3 = Vlib.Vec3;
  import Vec2 = Vlib.Vec2;
  import log = Glib.utils.log;

  export function calculateTangents(layout:any, indices:any[], vertices:any[]){
    if (!layout.normal){
      log('Can not calculate tangents for buffer. Normal definition not found in layout ', layout);
    }
    if (!layout.normal){
      log('Can not calculate tangents for buffer. Normal definition not found in layout ', layout);
    }
    if (!layout.texture){
      log('Can not calculate tangents for buffer. Texture definition not found in layout ', layout);
    }
    if (!layout.tangent){
      log('Can not calculate tangents for buffer. Tangent definition not found in layout ', layout);
    }
    if (!layout.bitangent){
      log('Can not calculate tangents for buffer. Bitangent definition not found in layout ', layout);
    }

    var stride = VertexLayout.countElements(layout);
    var offPos = VertexLayout.countElementsBefore(layout, 'position');
    var offNrm = VertexLayout.countElementsBefore(layout, 'normal');
    var offTex = VertexLayout.countElementsBefore(layout, 'texture');
    var offTan = VertexLayout.countElementsBefore(layout, 'tangent');
    var offBit = VertexLayout.countElementsBefore(layout, 'bitangent');

    var count = vertices.length / VertexLayout.countElements(layout);
    var index;

    var i, i1, i2, i3;
    var p1 = Vec3.zero(), p2 = Vec3.zero(), p3 = Vec3.zero();
    var t1 = Vec2.zero(), t2 = Vec2.zero(), t3 = Vec2.zero();
    var d1 = Vec3.zero(), d2 = Vec3.zero();
    var uv1 = Vec2.zero(), uv2 = Vec2.zero();

    // zero out tangents
    for (i = 0; i < count; i += 1) {
      index = i * stride + offTan;
      vertices[index    ] = 0;
      vertices[index + 1] = 0;
      vertices[index + 2] = 0;

      index = i * stride + offBit;
      vertices[index    ] = 0;
      vertices[index + 1] = 0;
      vertices[index + 2] = 0;
    }

    // accumulate tangents
    for (i = 0; i < indices.length; i += 1){
      i1 = indices[i    ];
      i2 = indices[i + 1];
      i3 = indices[i + 2];

      p1.initFromBuffer(vertices, i1 * stride + offPos);
      p2.initFromBuffer(vertices, i2 * stride + offPos);
      p3.initFromBuffer(vertices, i3 * stride + offPos);

      t1.initFromBuffer(vertices, i1 * stride + offTex);
      t2.initFromBuffer(vertices, i2 * stride + offTex);
      t3.initFromBuffer(vertices, i3 * stride + offTex);

      Vec3.subtract(p2, p1, d1);
      Vec3.subtract(p3, p1, d2);

      Vec2.subtract(t2, t1, uv1);
      Vec2.subtract(t3, t1, uv2);

      var r = 1 / (uv1.x * uv2.y - uv1.y * uv2.x);
      var dir1 = Vec3.subtract(
        Vec3.multiplyScalar(d1, uv2.y),
        Vec3.multiplyScalar(d2, uv1.y)
      ).multiplyScalar(r);
      var dir2 = Vec3.subtract(
        Vec3.multiplyScalar(d2, uv1.x),
        Vec3.multiplyScalar(d1, uv2.x)
      ).multiplyScalar(r);

      index = i1 * stride + offTan;
      vertices[index    ] += dir1.x;
      vertices[index + 1] += dir1.y;
      vertices[index + 2] += dir1.z;

      index = i2 * stride + offTan;
      vertices[index    ] += dir1.x;
      vertices[index + 1] += dir1.y;
      vertices[index + 2] += dir1.z;

      index = i3 * stride + offTan;
      vertices[index    ] += dir1.x;
      vertices[index + 1] += dir1.y;
      vertices[index + 2] += dir1.z;

      index = i1 * stride + offBit;
      vertices[index    ] += dir2.x;
      vertices[index + 1] += dir2.y;
      vertices[index + 2] += dir2.z;

      index = i2 * stride + offBit;
      vertices[index    ] += dir2.x;
      vertices[index + 1] += dir2.y;
      vertices[index + 2] += dir2.z;

      index = i3 * stride + offBit;
      vertices[index    ] += dir2.x;
      vertices[index + 1] += dir2.y;
      vertices[index + 2] += dir2.z;
    }

    var normal = Vec3.zero();
    var tangent = Vec3.zero();
    var bitangent = Vec3.zero();
    // orthogonalize
    for(i = 0; i < count; i += 1){
      index = i * stride;
      normal.initFromBuffer(vertices, index + offNrm);
      tangent.initFromBuffer(vertices, index + offTan);
      bitangent.initFromBuffer(vertices, index + offBit);

      var t:Vec3 = Vec3.subtract(tangent, Vec3.multiplyScalar(normal, normal.dot(tangent)));
      var h = Vec3.cross(normal, tangent).dot(bitangent) < 0 ? -1 : 1;
      var b:Vec3 = Vec3.cross(normal, t).multiplyScalar(h);

      if (!t.lengthSquared() || !b.lengthSquared()){
        t.init(1, 0, 0);
        b.init(0, 0, 1);
      } else {
        t.selfNormalize();
        b.selfNormalize();
      }

      t.copyTo(vertices, index + offTan);
      b.copyTo(vertices, index + offBit);
    }
  }
}