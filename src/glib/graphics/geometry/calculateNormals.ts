module Glib.Graphics.Geometry {

  import Vec3 = Vlib.Vec3;
  import Vec2 = Vlib.Vec2;
  import log = Glib.utils.log;
  import BufferData = Glib.Graphics.BufferData;

  export function calculateNormals(layout, indices:BufferData, vertices:BufferData){
    if (!layout.normal){
      log('Can not create normals for buffer. Normal definition not found in layout ', layout);
    }
    if (!layout.position){
      log('Can not create normals for buffer. Position definition not found in layout ', layout);
    }

    var i, index, epsilon = 0;
    var stride = Graphics.VertexLayout.countElements(layout);
    var offPos = Graphics.VertexLayout.countElementsBefore(layout, 'position');
    var offNrm = Graphics.VertexLayout.countElementsBefore(layout, 'normal');

    var v0 = Vec3.zero();
    var v1 = Vec3.zero();
    var v2 = Vec3.zero();
    var t0 = Vec3.zero();
    var t1 = Vec3.zero();
    var normal = Vec3.zero();

    // clear previous normals
    for (i = 0; i < indices.length; i += 1) {
      index = indices[i] * stride + offNrm;
      vertices[index    ] = 0; // x
      vertices[index + 1] = 0; // y
      vertices[index + 2] = 0; // z
    }

    // accumulate normals for each vertex of each each triangle face
    for (i = 0; i < indices.length; i += 3){
      v0.initFromBuffer(vertices, indices[i    ] * stride + offPos);
      v1.initFromBuffer(vertices, indices[i + 1] * stride + offPos);
      v2.initFromBuffer(vertices, indices[i + 2] * stride + offPos);

      Vec3.subtract(v2, v0, t0);
      Vec3.subtract(v1, v0, t1);
      Vec3.cross(t0, t1, normal);

      index = indices[i] * stride + offNrm;
      vertices[index    ] += normal.x;
      vertices[index + 1] += normal.y;
      vertices[index + 2] += normal.z;

      index = indices[i + 1] * stride + offNrm;
      vertices[index    ] += normal.x;
      vertices[index + 1] += normal.y;
      vertices[index + 2] += normal.z;

      index = indices[i + 2] * stride + offNrm;
      vertices[index    ] += normal.x;
      vertices[index + 1] += normal.y;
      vertices[index + 2] += normal.z;
    }

    // normalize all normals
    for (i = 0; i < indices.length; i += 1) {
      index = indices[i] * stride + offNrm;
      normal.initFromBuffer(vertices, index);
      if (normal.lengthSquared() > epsilon){
        normal.selfNormalize();
      } else {
        normal.init(0, 0, 0);
      }
      normal.copyTo(vertices, index);
    }
  }
}
