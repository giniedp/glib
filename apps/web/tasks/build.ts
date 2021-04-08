import { parallel } from 'gulp'
import { assets, assetsWatch } from './assets'
import { pages, pagesWatch } from './pages'

export const build = parallel(assets, pages)
export const watch = parallel(assetsWatch, pagesWatch)
