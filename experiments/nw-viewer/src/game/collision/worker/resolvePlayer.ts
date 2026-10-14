import { PLAYER_FALL_SPEED, PLAYER_STEP_HEIGHT } from '../../../constants'
import { regionContains, sampleRegionHeightAsTerrain, type RegionHeightmap } from '../../terrain/heightSampling'
import type { PlayerRequest, PlayerResult } from '../shared'

export interface CollisionWorld {
  heightmaps: ReadonlyMap<string, RegionHeightmap>
}

/**
 * Resolves the requested feet position of the player, no physics: steps up instantly and falls with a constant
 * speed onto the highest ground below `feet + step`. z = 0 is the lowest possible ground.
 */
export function resolvePlayer(world: CollisionWorld, req: PlayerRequest, out: PlayerResult): PlayerResult {
  const x = req.x
  const y = req.y
  const feet = req.z
  const ground = groundHeight(world, x, y, feet + PLAYER_STEP_HEIGHT)

  out.x = x
  out.y = y
  if (ground >= feet) {
    // on the ground or a step up
    out.z = ground
  } else {
    // falling, no acceleration
    out.z = Math.max(ground, feet - PLAYER_FALL_SPEED * req.dt)
  }
  return out
}

/**
 * Highest ground at x/y, at least 0. Terrain always counts (it has no overhangs), shapes only below `top`.
 */
function groundHeight(world: CollisionWorld, x: number, y: number, top: number): number {
  let ground = 0
  for (const region of world.heightmaps.values()) {
    if (!regionContains(region, x, y)) {
      continue
    }
    const height = sampleRegionHeightAsTerrain(region, x, y)
    if (height > ground) {
      ground = height
    }
  }
  return ground
}
