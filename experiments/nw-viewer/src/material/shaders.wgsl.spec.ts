/// <reference types="@webgpu/types" />
import { beforeAll, describe, expect, it } from 'vitest'
import FX_MESH_ADVANCED_WGSL from './FxMeshAdvancedMaterial.wgsl'
import ILLUM_WGSL from './IllumMaterial.wgsl'
import { TERRAIN_PATCH_SHADER } from './TerrainPatchMaterial.wgsl'
import VEGETATION_WGSL from './VegetationMaterial.wgsl'
import { lightingWgsl } from '../graphics/passes/lighting/LightingPass.wgsl'

// compiles material shader sources on the GPU and checks the entry points the render variants use
const SHADERS: Array<{ name: string; source: string; fragmentEntries: string[] }> = [
  { name: 'Illum', source: ILLUM_WGSL, fragmentEntries: ['fs_main', 'fs_gbuffer', 'fs_emissive'] },
  { name: 'TerrainPatch', source: TERRAIN_PATCH_SHADER, fragmentEntries: ['fs_main', 'fs_gbuffer'] },
  { name: 'Vegetation', source: VEGETATION_WGSL, fragmentEntries: ['fs_main', 'fs_gbuffer'] },
  {
    name: 'FxMeshAdvanced',
    source: FX_MESH_ADVANCED_WGSL,
    fragmentEntries: ['fs_main', 'fs_gbuffer', 'fs_emissive'],
  },
]

describe('material shaders', () => {
  let device: GPUDevice
  beforeAll(async () => {
    const adapter = await navigator.gpu.requestAdapter()
    device = await adapter!.requestDevice()
  })

  for (const shader of SHADERS) {
    it(`${shader.name} compiles`, async () => {
      const module = device.createShaderModule({ code: shader.source })
      const info = await module.getCompilationInfo()
      const errors = info.messages
        .filter((m) => m.type === 'error')
        .map((m) => `${m.lineNum}:${m.linePos} ${m.message}`)
      expect(errors).toEqual([])
    })

    for (const entry of shader.fragmentEntries) {
      it(`${shader.name} has fragment entry ${entry}`, () => {
        expect(shader.source).toMatch(new RegExp(`@fragment\\s+fn\\s+${entry}\\s*\\(`))
      })
    }
  }

  // the deferred lighting reuses the material lighting chunks (COMMON_WGSL) in a compute shader,
  // the pipeline creation checks that no fragment only builtin is reachable from the compute entry point
  for (const samples of [1, 4] as const) {
    it(`deferred lighting compute pipeline builds (${samples}x)`, async () => {
      device.pushErrorScope('validation')
      const module = device.createShaderModule({ code: lightingWgsl(samples) })
      device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } })
      const error = await device.popErrorScope()
      expect(error?.message ?? null).toBe(null)
    })
  }
})
