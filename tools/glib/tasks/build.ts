import { clean } from './clean'
import { bundle } from './bundle'
import { compile } from './compile'
import { series } from 'gulp'

export const rebuild = series(clean, compile, bundle)
export const build = series(compile, bundle)
