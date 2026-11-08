import type { GroupPass, RenderPass } from '@gglib/render'

/**
 * How the pipeline panel shows a pass. Set by the pipeline definition, which knows what the frame depends on.
 */
export interface PassInfo {
  /**
   * The object whose `enabled` flag turns the pass on and off. Only set for passes the frame works without
   * (effects and debug views). Other passes are shown read only.
   */
  toggle?: { enabled: boolean }
  /**
   * Short read only description, e.g. what an input pass binds
   */
  note?: string
}

/**
 * A group whose variants are switched by the pipeline modes (MSAA, forward/deferred). Only the active variant is
 * shown, its toggle belongs to the switch.
 */
export interface PassSwitchInfo {
  variants: Array<{ label: string; group: GroupPass }>
}

const passInfos = new WeakMap<object, PassInfo>()
const switchInfos = new WeakMap<object, PassSwitchInfo>()

/**
 * Annotates a pass for the pipeline panel
 */
export function describePass<T extends RenderPass>(pass: T, info: PassInfo): T {
  passInfos.set(pass, { ...passInfos.get(pass), ...info })
  return pass
}

/**
 * Marks a pass the frame works without, so the panel offers to turn it off
 *
 * @param toggle - the object whose `enabled` flag controls the pass, defaults to the pass
 */
export function optionalPass<T extends RenderPass>(pass: T, toggle?: { enabled: boolean }): T {
  const target = toggle ?? (pass as unknown as { enabled: boolean })
  if (!('enabled' in target)) {
    throw new Error(`Pass ${pass.name} has no enabled flag`)
  }
  return describePass(pass, { toggle: target })
}

export function getPassInfo(pass: RenderPass): PassInfo | null {
  return passInfos.get(pass) ?? null
}

/**
 * Registers a group whose variants are switched by the pipeline modes
 */
export function describeSwitch(group: GroupPass, variants: PassSwitchInfo['variants']): GroupPass {
  switchInfos.set(group, { variants })
  return group
}

export function getSwitchInfo(pass: RenderPass): PassSwitchInfo | null {
  return switchInfos.get(pass) ?? null
}
