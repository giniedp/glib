/**
 * Bundles all gglib packages in one namespace.
 *
 * @remarks
 * This is the standalone bundle of the gglib library. It re-exports
 * all packages from the `@gglib/*` namespace.
 *
 * @packageDocumentation
 */

import * as $Content from '@gglib/content'
import * as $ContentLoaders from '@gglib/content-loaders'
import * as $Ecs from '@gglib/ecs'
import * as $EcsComponents from '@gglib/ecs-components'
import * as $FxMaterials from '@gglib/fx-materials'
import * as $FxPost from '@gglib/fx-post'
import * as $FxProcedural from '@gglib/fx-procedural'
import * as $Graphics from '@gglib/graphics'
import * as $Input from '@gglib/input'
import * as $Math from '@gglib/math'
import * as $Noise from '@gglib/noise'
import * as $Render from '@gglib/render'
import * as $Particles from '@gglib/particles'
import * as $Terrain from '@gglib/terrain'
import * as $Utils from '@gglib/utils'

/**
 * This is the content pipeline.
 *
 * @public
 */
export const Content = $Content
/**
 * This contains all content loaders using the contentn pipeline
 *
 * @public
 */
export const ContentLoaders = $ContentLoaders
/**
 * Common utility functions that are used by most of the other packages.
 *
 * @public
 */
export const Utils = $Utils
/**
 * A lightweight but powerful entity component system.
 *
 * @public
 */
export const Ecs = $Ecs
/**
 * Entity component system components
 *
 * @public
 */
export const EcsComponents = $EcsComponents
/**
 * Shader and effect composition library.
 *
 * @public
 */
export const FxMaterials = $FxMaterials
/**
 * Shader and effect composition library.
 *
 * @public
 */
export const FxPost = $FxPost
/**
 * Shader and effect composition library.
 *
 * @public
 */
export const FxProcedural = $FxProcedural
/**
 * WebGL abstraction and the heart of gglib.
 *
 * @public
 */
export const Graphics = $Graphics
/**
 * Keyboard, Mouse, Gamepad and VR device abstractions can be found here
 *
 * @public
 */
export const Input = $Input
/**
 * A 3D math library.
 *
 * @public
 */
export const Math = $Math
/**
 * Particles library
 *
 * @public
 */
export const Particles = $Particles
/**
 * Procedural noise generation.
 *
 * @public
 */
export const Noise = $Noise
/**
 * The render system.
 *
 * @public
 */
export const Render = $Render
/**
 * A simple terrain implementation.
 *
 * @public
 */
export const Terrain = $Terrain
/**
 * Bundles all other packages in one namespace.
 *
 * @public
 */
export const Gglib = {
  Content,
  ContentLoaders,
  Ecs,
  EcsComponents,
  FxMaterials,
  FxPost,
  FxProcedural,
  Graphics,
  Input,
  Math,
  Noise,
  Render,
  Terrain,
  Utils,
}

export default Gglib
