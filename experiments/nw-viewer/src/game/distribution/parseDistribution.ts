import type { RegionDistributionData } from '../../api'

/**
 * Instances of one distribution type inside a cell.
 */
export interface DistributionRun {
  /**
   * Index into {@link RegionDistributionData.types}
   */
  type: number
  /**
   * Start index into {@link DistributionData.order}
   */
  start: number
  /**
   * Number of instances
   */
  count: number
}

export interface DistributionCell {
  /**
   * Cell index in x direction
   */
  x: number
  /**
   * Cell index in y direction
   */
  y: number
  /**
   * Cell index in the grid, `y * cellsPerAxis + x`
   */
  index: number
  runs: DistributionRun[]
}

export interface DistributionData {
  header: RegionDistributionData
  /**
   * Type index per instance
   */
  types: Uint16Array
  /**
   * Region local x per instance, 0..0xFFFF maps to 0..regionSize
   */
  posX: Uint16Array
  /**
   * Region local y per instance, 0..0xFFFF maps to 0..regionSize
   */
  posY: Uint16Array
  /**
   * Instance indices sorted by cell and type
   */
  order: Uint32Array
  /**
   * Number of cells per axis
   */
  cellsPerAxis: number
  /**
   * Non empty cells
   */
  cells: DistributionCell[]
}

/**
 * Wraps the binary instance data and buckets the instances into cells of a regular grid
 *
 * @param header - the distribution header
 * @param data - the binary instance data
 * @param cellsPerAxis - number of cells per region axis, must be a power of two
 */
export function parseDistribution(
  header: RegionDistributionData,
  data: ArrayBuffer,
  cellsPerAxis: number,
): DistributionData {
  const count = header.count
  const types = new Uint16Array(data, 0, count)
  const posX = new Uint16Array(data, count * 2, count)
  const posY = new Uint16Array(data, count * 4, count)

  // counting sort by bucket = cell * typeCount + type
  const typeCount = header.types.length
  const cellShift = 16 - Math.log2(cellsPerAxis)
  const bucketCount = cellsPerAxis * cellsPerAxis * typeCount
  const bucketStart = new Uint32Array(bucketCount + 1)
  const buckets = new Uint32Array(count)
  for (let i = 0; i < count; i++) {
    const cell = (posY[i] >> cellShift) * cellsPerAxis + (posX[i] >> cellShift)
    const bucket = cell * typeCount + types[i]
    buckets[i] = bucket
    bucketStart[bucket + 1]++
  }
  for (let i = 0; i < bucketCount; i++) {
    bucketStart[i + 1] += bucketStart[i]
  }
  const order = new Uint32Array(count)
  const cursor = bucketStart.slice(0, bucketCount)
  for (let i = 0; i < count; i++) {
    order[cursor[buckets[i]]++] = i
  }

  const cells: DistributionCell[] = []
  for (let cellIndex = 0; cellIndex < cellsPerAxis * cellsPerAxis; cellIndex++) {
    let cell: DistributionCell = null
    for (let type = 0; type < typeCount; type++) {
      const bucket = cellIndex * typeCount + type
      const start = bucketStart[bucket]
      const runCount = bucketStart[bucket + 1] - start
      if (!runCount) {
        continue
      }
      if (!cell) {
        cell = {
          x: cellIndex % cellsPerAxis,
          y: Math.floor(cellIndex / cellsPerAxis),
          index: cellIndex,
          runs: [],
        }
        cells.push(cell)
      }
      cell.runs.push({ type, start, count: runCount })
    }
  }

  return {
    header,
    types,
    posX,
    posY,
    order,
    cellsPerAxis,
    cells,
  }
}
