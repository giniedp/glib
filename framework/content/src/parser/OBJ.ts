function readFloat(item: string): number {
  if (item) {
    return parseFloat(item)
  }
  return null
}

function readFloatArray(item: string): number[] {
  return item.split(' ').map(readFloat)
}

function readTriplet(item: string): number[] {
  return item.split('/').map(readFloat)
}

function readTripletArray(item: string): number[][] {
  return item.split(' ').map(readTriplet)
}

function getLines(value: string): string[] {
  return value.replace(/\r/g, '\n').split('\n')
}

function makeAbsoluteIndex(index: number, buffer: any[]): number {
  if (index < 0) {
    return buffer.length + index + 1
  }
  return index
}

function createGroup(name?: string): ObjGroup {
  return {
    name: name,
    f: [],
    p: [],
    l: [],
  }
}

function createData(): ObjData {
  return {
    name: null,
    v: [],
    vt: [],
    vn: [],
    vp: [],
    groups: [],
  }
}
export type ObjVertex = number[]
export type ObjIndices = number[]
export type ObjPolygon = ObjIndices[]

export interface ObjGroup {
  name: string
  f: ObjPolygon[]
  p: ObjPolygon[]
  l: ObjPolygon[]
  lod?: number
  material?: string
  maplib?: string[]
}

export interface ObjData {
  name: string
  v: ObjVertex[]
  vt: ObjVertex[]
  vn: ObjVertex[]
  vp: ObjVertex[]
  materials?: string[]
  groups: ObjGroup[]
}

export class OBJ {
  public result: ObjData
  private groups: ObjGroup[]
  private group: ObjGroup

  public static parse(content: string): ObjData {
    return new OBJ().parse(content)
  }

  public parse(data: string) {
    let lines = getLines(data)
    this.result = createData()
    this.groups = this.result.groups

    let currentLine = ''
    for (let line of lines) {
      // remove comments
      let cIndex = line.indexOf('#')
      if (cIndex >= 0) {
        line = line.substr(0, cIndex)
      }

      // trim whitespaces
      line = line.replace(/\s+/g, ' ').trim()

      // skip blank lines
      if (!line) {
        continue
      }

      // join multi line strings
      if (line.match(/\\$/)) {
        currentLine = currentLine + line.replace(/\\$/, '')
        continue
      } else if (currentLine) {
        line = currentLine + line
        currentLine = ''
      }

      // parse line
      let match = line.match(/^(\w+)\s(.*)$/)
      if (!match) {
        continue
      }
      let key = match[1]
      let value = match[2]
      let reader = this[`read_${key}_key`]
      if (reader) {
        reader.apply(this, [value])
      }
    }
    return this.result
  }

  private get currentGroup() {
    if (!this.group) {
      this.group = createGroup()
      this.groups.push(this.group)
    }
    return this.group
  }

  //
  // Object name statements let you assign a name to an entire
  // object in a single file
  //
  private read_o_key(data: string) {
    this.result.name = data
  }

  // Group name statements are used to organize collections of
  // elements and simplify data manipulation for operations in
  // Model.
  private read_g_key(data: string) {
    this.group = createGroup()
    this.group.name = data
    this.groups.push(this.group)
  }

  // Smoothing group statements let you identify elements over
  // which normals are to be interpolated to give those elements
  // a smooth, non-faceted appearance. This is a quick way to
  // specify vertex normals.
  private read_s_key(data: string) {
    data = (data === 'off' ? '0' : data)
    if (data !== '0') {
      // this.currentGroup().smoothGroup = parseInt(data);
    }
  }

  // Merging group statements are used to identify free-form
  // elements that should be inspected for adjacency detection.
  // You can also use merging groups to exclude surfaces which
  // are close enough to be considered adjacent but should not be
  // merged.
  private read_mg_key(data: string) {
    // let param = data.split(" ");
    // let c = this.currentGroup();
    // c.mergeGroup = parseInt(param[0]);
    // c.mergeDistance = parseInt(param[1]);
  }

  private read_lod_key(data: string) {
    this.currentGroup.lod = parseInt(data, 10)
  }

  private read_maplib_key(data: string) {
    this.currentGroup.maplib = data.split(' ')
  }

  private read_mtllib_key(data: string) {
    this.result.materials = data.split(' ')
  }

  private read_usemtl_key(data: string) {
    let g = this.currentGroup
    if (g.material) {
      this.read_g_key(g.name)
    }
    this.currentGroup.material = data
  }

  //
  // ELEMENTS
  //

  // Geometric vertices
  //
  private read_v_key(data: string) {
    this.result.v.push(readFloatArray(data))
  }

  // Texture vertices
  //
  private read_vt_key(data: string) {
    this.result.vt.push(readFloatArray(data))
  }

  // Vertex normals
  //
  private read_vn_key(data: string) {
    this.result.vn.push(readFloatArray(data))
  }

  // Parameter space vertices
  //
  private read_vp_key(data: string) {
    this.result.vp.push(readFloatArray(data))
  }

  //
  // ELEMENTS
  //

  // Point
  //
  private read_p_key(data: string) {
    this.currentGroup.p.push(readTripletArray(data))
  }

  // Line
  //
  private read_l_key(data: string) {
    this.currentGroup.l.push(readTripletArray(data))
  }

  // Face
  //
  private read_f_key(data: string) {
    let buffers = [this.result.v, this.result.vt, this.result.vn]
    let face = readTripletArray(data).map((e) => {
      return e.map((index, eIndex) => {
        return makeAbsoluteIndex(index, buffers[eIndex])
      })
    })
    this.currentGroup.f.push(face)
  }
}
