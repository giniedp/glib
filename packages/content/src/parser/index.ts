import * as DAE from './dae'
import { FBX } from './FBX'
import { JSON } from './JSON'
import { MD5 } from './MD5'
import { MTL } from './MTL'
import { OBJ } from './OBJ'
import { TGA } from './TGA'
import { YML } from './YML'

export * from './FBX'
export * from './JSON'
export * from './MD5'
export * from './MTL'
export * from './OBJ'
export * from './TGA'
export * from './YML'

export const Parser = {
  DAE,
  FBX,
  JSON,
  MD5,
  MTL,
  OBJ,
  TGA,
  YML,
}
