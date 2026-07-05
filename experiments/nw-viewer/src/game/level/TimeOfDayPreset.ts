import { vec3, type IVec3 } from '@gglib/math'
import type { TimeOfDay } from '../../api'
import { getTodParamByName, TodParams, type TodParam } from './TimeOfDayParams'

const loggedUnknowns = {}
export class TimeOfDayPreset {
  public time: number
  public timeStart: number
  public timeEnd: number
  public timeAnimSpeed: number
  public variables: Record<string, TodParam<any>> = {}

  public constructor(definition?: TimeOfDay) {
    this.reset()
    if (definition) {
      this.applyDefinition(definition)
    }
  }

  public reset() {
    this.time = 12
    this.timeStart = 0
    this.timeEnd = 24
    this.timeAnimSpeed = 0
    Object.values(TodParams).forEach((param) => {
      this.variables[param.name] = JSON.parse(JSON.stringify(param))
    })
  }

  public applyDefinition(tod: TimeOfDay) {
    this.time = tod.time
    this.timeStart = tod.timeStart
    this.timeEnd = tod.timeEnd
    this.timeAnimSpeed = tod.timeAnimSpeed
    for (const v of tod.variable) {
      const preset = getTodParamByName(v.name)
      if (!preset) {
        if (!loggedUnknowns[v.name]) {
          // console.warn(`Unknown TOD variable: ${v.name}`)
          loggedUnknowns[v.name] = true
        }
        continue
      }
      if (preset.type === 'color') {
        const param: TodParam<IVec3> = JSON.parse(JSON.stringify(preset))
        param.value = vec3(v.color)
        this.variables[param.name] = param
      } else {
        const param: TodParam<number> = JSON.parse(JSON.stringify(preset))
        param.value = v.value
        this.variables[param.name] = param
      }
    }
  }
}
