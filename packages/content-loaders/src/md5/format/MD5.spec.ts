import { MD5Mesh } from './MD5Mesh'

describe('glib/content/format/MD5', () => {
  let parsed: MD5Mesh

  beforeAll(() => {
    parsed = MD5Mesh.parse(`
// some comments
//

MD5Version 10
commandline "Command line string"

numJoints 3
numMeshes 2

joints {
	"origin"	-1 ( -0.000000 0.001643 -0.000604 ) ( -0.707107 -0.000242 -0.707107 )		//
	"sheath"	0 ( 1.100481 -0.317714 3.170247 ) ( 0.307041 -0.578615 0.354181 )		// origin
	"sword"	1 ( 0.980960 -0.936157 4.075372 ) ( 0.305556 -0.578156 0.353505 )		// sheath
}

mesh {
	shader "mesh_shader_1"

	numverts 3
	vert 0 ( 0.683594 0.455078 ) 0 3
  vert 1 ( 0.773438 0.439453 ) 3 2
  vert 2 ( 0.738281 0.464844 ) 5 2

	numtris 3
	tri 0 0 2 1
	tri 1 3 5 4
  tri 2 6 8 7

	numweights 3
	weight 0 16 0.333333 ( -0.194917 0.111128 -0.362937 )
	weight 1 5 0.333333 ( 0.115237 1.409351 0.894934 )
	weight 2 6 0.333333 ( 0.126628 -0.030269 0.894934 )
}

mesh {
	shader "mesh_shader_2"

	numverts 3
	vert 0 ( 0.683594 0.455078 ) 0 3
  vert 1 ( 0.773438 0.439453 ) 3 2
  vert 2 ( 0.738281 0.464844 ) 5 2

	numtris 3
	tri 0 0 2 1
	tri 1 3 5 4
  tri 2 6 8 7

	numweights 3
	weight 0 16 0.333333 ( -0.194917 0.111128 -0.362937 )
	weight 1 5 0.333333 ( 0.115237 1.409351 0.894934 )
	weight 2 6 0.333333 ( 0.126628 -0.030269 0.894934 )
}
`)

  })

  it('parses header', () => {
    expect(parsed.MD5Version).toBe(10)
    expect(parsed.commandline).toBe('Command line string')
    expect(parsed.numJoints).toBe(3)
    expect(parsed.numMeshes).toBe(2)
  })

  it('parses joints', () => {
    expect(parsed.joints.length).toBe(3, 'joint count')
    expect(parsed.joints[0].name).toBe('origin')
    expect(parsed.joints[0].parentIndex).toBe(-1)
    expect(parsed.joints[0].position.x).toBeCloseTo(-0.000000)
    expect(parsed.joints[0].position.y).toBeCloseTo(0.001643)
    expect(parsed.joints[0].position.z).toBeCloseTo(-0.000604)
    expect(parsed.joints[0].rotation.x).toBeCloseTo(-0.707107)
    expect(parsed.joints[0].rotation.y).toBeCloseTo(-0.000242)
    expect(parsed.joints[0].rotation.z).toBeCloseTo(-0.707107)

    expect(parsed.joints[2].name).toBe('sword')
    expect(parsed.joints[2].parentIndex).toBe(1)
    expect(parsed.joints[2].position.x).toBeCloseTo(0.980960)
    expect(parsed.joints[2].position.y).toBeCloseTo(-0.936157)
    expect(parsed.joints[2].position.z).toBeCloseTo(4.075372)
    expect(parsed.joints[2].rotation.x).toBeCloseTo(0.305556)
    expect(parsed.joints[2].rotation.y).toBeCloseTo(-0.578156)
    expect(parsed.joints[2].rotation.z).toBeCloseTo(0.353505)

  })

  it('parses meshes', () => {
    expect(parsed.meshes.length).toBe(2, 'mesh count')
    expect(parsed.meshes[0].shader).toBe('mesh_shader_1')
    expect(parsed.meshes[1].shader).toBe('mesh_shader_2')
  })

  it('parses mesh Vertices', () => {
    expect(parsed.meshes[0].vert.length).toBe(3)
    expect(parsed.meshes[0].vert[0].index).toBe(0)
    expect(parsed.meshes[0].vert[1].index).toBe(1)
    expect(parsed.meshes[0].vert[2].index).toBe(2)

    expect(parsed.meshes[0].vert[0].uv.x).toBeCloseTo(0.683594)
    expect(parsed.meshes[0].vert[0].uv.y).toBeCloseTo(0.455078)

    expect(parsed.meshes[0].vert[0].weightIndex).toBeCloseTo(0)
    expect(parsed.meshes[0].vert[0].weightCount).toBeCloseTo(3)
  })

  it('parses mesh triangles', () => {
    expect(parsed.meshes[0].tri.length).toBe(3)
    expect(parsed.meshes[0].tri[0].index).toBe(0)
    expect(parsed.meshes[0].tri[1].index).toBe(1)
    expect(parsed.meshes[0].tri[2].index).toBe(2)

    expect(parsed.meshes[0].tri[0].v1).toBeCloseTo(0)
    expect(parsed.meshes[0].tri[0].v2).toBeCloseTo(2)
    expect(parsed.meshes[0].tri[0].v3).toBeCloseTo(1)
  })

  it('parses mesh weights', () => {
    expect(parsed.meshes[0].weight.length).toBe(3)
    expect(parsed.meshes[0].weight[0].index).toBe(0)
    expect(parsed.meshes[0].weight[1].index).toBe(1)
    expect(parsed.meshes[0].weight[2].index).toBe(2)

    expect(parsed.meshes[0].weight[0].jointIndex).toBeCloseTo(16)
    expect(parsed.meshes[0].weight[0].value).toBeCloseTo(0.333333)
    expect(parsed.meshes[0].weight[0].position.x).toBeCloseTo(-0.194917)
    expect(parsed.meshes[0].weight[0].position.y).toBeCloseTo(0.111128)
    expect(parsed.meshes[0].weight[0].position.z).toBeCloseTo(-0.362937)
  })
})
