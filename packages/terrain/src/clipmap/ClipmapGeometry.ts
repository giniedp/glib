import { Device, ModelBuilder, ModelMesh } from '@gglib/graphics'
import { Mat4, Vec3 } from 'math'

export enum ClipmapPatch {
  MxM01,
  MxM02,
  MxM03,
  MxM04,
  MxM05,
  MxM06,
  MxM07,
  MxM08,
  MxM09,
  MxM10,
  MxM11,
  MxM12,

  RingFixup,

  InteriorTop,
  InteriorRight,
  InteriorBottom,
  InteriorLeft,

  Inner1,
  Inner2,
  Inner3,
  Inner4,
  Inner5,

  OuterDegenerate,
}

export class ClipmapGeometry {

  private readonly meshes: { [k: number]: ModelMesh}

  public getMesh(type: ClipmapPatch): ModelMesh {
    return this.meshes[type]
  }

  public constructor(private device: Device, private size: number) {
    const n = size
    const builder = new ModelBuilder({
      layout: 'Position',
    })

    // Precalculate offset values. These are used to shift around
    // the generated patches, to their location around the center
    const m = (n + 1) / 4
    const off1 = 0 * (m - 1) + 0
    const off2 = 1 * (m - 1) + 0
    const off3 = 2 * (m - 1) + 2
    const off4 = 3 * (m - 1) + 2
    const offMid = 2 * (m - 1)
    const half = Math.floor(n / 2)

    const toOrigin = Mat4.createTranslation(-half, 0, -half)

    // Generate the 12 MxM blocks. This can be optimized in two ways:
    // - Use same index buffer for all MxM blocks
    // - Use only one Block, but use Instancing to render 12 blocks

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off1, 0, off1), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM01] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off2, 0, off1), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM02] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off3, 0, off1), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM03] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off4, 0, off1), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM04] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off1, 0, off2), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM05] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off2, 0, off2), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM06] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off3, 0, off3), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM07] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off4, 0, off3), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM08] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off1, 0, off4), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM09] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off2, 0, off4), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM10] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off3, 0, off4), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM11] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off4, 0, off4), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.MxM12] = builder.endMesh(this.device)
    builder.reset()

    // Generate 4 ring fixup castedPatches.
    // Since they are small, put them all into one geometry. Even
    // if they seldom are visible all together at the same time.

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(offMid, 0, off1), toOrigin), () => {
      appendBlockMxN(builder, 3, m)
    })
    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off1, 0, offMid), toOrigin), () => {
      appendBlockMxN(builder, m, 3)
    })
    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off4, 0, offMid), toOrigin), () => {
      appendBlockMxN(builder, m, 3)
    })
    builder.withTransform(Mat4.multiply(Mat4.createTranslation(offMid, 0, off4), toOrigin), () => {
      appendBlockMxN(builder, 3, m)
    })
    this.meshes[ClipmapPatch.RingFixup] = builder.endMesh(this.device)
    builder.reset()

    // Generate interior trims, for the L shaped Region
    //
    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off2, 0, off2), toOrigin), () => {
      appendBlockMxN(builder, 2 * m + 1, 2)
    })
    this.meshes[ClipmapPatch.InteriorTop] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off2, 0, off4 - 1), toOrigin), () => {
      appendBlockMxN(builder, 2 * m + 1, 2)
    })
    this.meshes[ClipmapPatch.InteriorBottom] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off2, 0, off2), toOrigin), () => {
      appendBlockMxN(builder, 2, 2 * m + 1)
    })
    this.meshes[ClipmapPatch.InteriorLeft] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off4 - 1, 0, off2), toOrigin), () => {
      appendBlockMxN(builder, 2, 2 * m + 1)
    })
    this.meshes[ClipmapPatch.InteriorRight] = builder.endMesh(this.device)
    builder.reset()

    // Generate interior level castedPatches
    //

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off2, 0, off2), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.Inner1] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off3 - 2, 0, off2), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.Inner2] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off2, 0, off3 - 2), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.Inner3] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off3 - 2, 0, off3 - 2), toOrigin), () => {
      appendBlockMxN(builder, m, m)
    })
    this.meshes[ClipmapPatch.Inner4] = builder.endMesh(this.device)
    builder.reset()

    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off4 - 2, 0, off2), toOrigin), () => {
      appendBlockMxN(builder, 3, 2 * m + 1)
    })
    builder.withTransform(Mat4.multiply(Mat4.createTranslation(off2, 0, off4 - 2), toOrigin), () => {
      appendBlockMxN(builder, 2 * m + 1, 3)
    })
    this.meshes[ClipmapPatch.Inner5] = builder.endMesh(this.device)
    builder.reset()

    // Generate the degenerated triangles
    //
    builder.withTransform(toOrigin, () => {
      appendDegenerates(builder, n)
    })
    this.meshes[ClipmapPatch.OuterDegenerate] = builder.endMesh(this.device)
    builder.reset()

  }
}

function appendBlockMxN(builder: ModelBuilder, m: number, n: number) {
  const base = builder.vertexCount

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < m; x++) {
      builder.addVertex({
        x: x,
        y: 0,
        z: y,
      })
    }
  }

  for (let y = 0; y < n - 1; y++) {
    builder.addIndex(base + y * m)
    for (let x = 0; x < m; x++) {
      builder.addIndex(base + y * m + x)
      builder.addIndex(base + y * m + x + m)
    }
    builder.addIndex(base + y * m + 2 * m - 1)
  }
}

function appendDegenerates(builder: ModelBuilder, m: number) {
  let base = builder.vertexCount
  let index = 0

  // TOP degenerate
  for (let x = 0; x < m; x++) {
    builder.addVertex({ x: x, y: 0, z: 0 })
    builder.addIndex(base + index++)
  }
  builder.addIndex(base + index)

  // RIGHT degenerate
  base = builder.vertexCount
  index = 0
  for (let y = 0; y < m; y++) {
    builder.addVertex({ x: m - 1, y: 0, z: y})
    builder.addIndex(base + index++)
  }
  builder.addIndex(base + index)

  // BOTTOM degenerate
  base = builder.vertexCount
  index = 0
  for (let x = m - 1; x > 0; x--) {
    builder.addVertex({ x: x, y: 0, z: m - 1 })
    builder.addIndex(base + index++)
  }

  // LEFT degenerate
  base = builder.vertexCount
  index = 0
  for (let y = m - 1; y > 0; y--) {
    builder.addVertex({ x: 0, y: 0, z: y })
    builder.addIndex(base + index++)
  }
}
