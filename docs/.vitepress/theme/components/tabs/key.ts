import type { ComputedRef, InjectionKey } from 'vue'

export const tabsKey: InjectionKey<{ uid: string; selected: ComputedRef<string> }> = Symbol('plugin-tabs')
