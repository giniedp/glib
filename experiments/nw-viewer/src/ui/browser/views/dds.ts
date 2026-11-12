import { statFile, type DdsPart } from '../../../api/browse'
import { assembleDds, type AssembledDds, type DdsSplitPart } from '../../../formats/dds/assemble'
import { contentBytes, fileBytes } from './content'

/**
 * A texture of the pak, reassembled from its split files
 */
export interface DdsTexture {
  /**
   * The texture itself: `x.dds`, or `x.dds.a` when the alpha file was opened
   */
  color: AssembledDds
  /**
   * The attached alpha texture `x.dds.a` of `x.dds`, null if there is none or it was opened itself
   */
  alpha: AssembledDds | null
}

/**
 * Loads a `.dds` (or `.dds.a`) and its split parts, and assembles them into plain DDS files.
 *
 * @remarks
 * The files are read raw (`merge=false`), the parts are listed by the stat of the base file. The base file shares the
 * content cache of the tab (Hex mode), the parts are read once for the assembly.
 */
export async function loadDds(path: string, signal?: AbortSignal): Promise<DdsTexture> {
  const isAlpha = path.endsWith('.dds.a')
  // the parts of `x.dds.a` are listed by `x.dds`
  const colorPath = isAlpha ? path.slice(0, -2) : path
  const stat = await statFile(colorPath, signal)
  const colorParts = stat.parts.filter((it) => !it.alpha)
  const alphaBase = stat.parts.find((it) => it.alpha && it.path.endsWith('.dds.a'))
  const alphaParts = stat.parts.filter((it) => it.alpha && it !== alphaBase)

  if (isAlpha) {
    return { color: await assembleFile(contentBytes(path), alphaParts, signal), alpha: null }
  }
  const [color, alpha] = await Promise.all([
    assembleFile(contentBytes(path), colorParts, signal),
    // not the tab's file, so not in the content cache (it is released with the tab's path only)
    alphaBase ? assembleFile(fileBytes(alphaBase.path, signal), alphaParts, signal) : null,
  ])
  return { color, alpha }
}

async function assembleFile(
  baseBytes: Promise<Uint8Array>,
  parts: DdsPart[],
  signal?: AbortSignal,
): Promise<AssembledDds> {
  const [base, ...data] = await Promise.all([baseBytes, ...parts.map((it) => fileBytes(it.path, signal))])
  signal?.throwIfAborted()
  const split: DdsSplitPart[] = parts.map((it, i) => ({ number: it.mip, data: data[i] }))
  return assembleDds(base, split)
}
