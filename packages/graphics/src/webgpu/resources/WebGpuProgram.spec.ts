import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WebGpuDevice } from '../WebGpuDevice'
import { WebGpuShaderModule } from './WebGpuShaderModule'

const SHADER_BASE = /* wgsl */ `
  @vertex
  fn vs_main(@location(0) a_position: vec3<f32>) -> @builtin(position) vec4<f32> {
    return vec4<f32>(a_position, 1.0);
  }

  @fragment
  fn fs_main() -> @location(0) vec4<f32> {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }
`

describe('WebGpuProgram', () => {
  let device: WebGpuDevice
  beforeEach(async () => {
    device = await new WebGpuDevice({}).ready
  })

  afterEach(() => {
    device.dispose()
  })

  describe('resolution failures', () => {
    let shader: WebGpuShaderModule

    beforeEach(async () => {
      shader = device.createShaderModule({
        wgsl: /* wgsl */ `
          ${SHADER_BASE}

          struct MaterialBlock {
            baseColor: vec4<f32>,
          }

          @group(0) @binding(0) var<uniform> material: MaterialBlock;
        `,
      })
      await shader.ready
    })

    it('returns null for an unknown block', () => {
      expect(shader.program.get('unknown')).toBeNull()
    })

    it('returns null for a dotted path with an unknown block', () => {
      expect(shader.program.get('unknown.field')).toBeNull()
    })

    it('returns null for a valid block with an unknown member', () => {
      expect(shader.program.get('material.unknown')).toBeNull()
    })
  })

  describe('uniform block resolution', () => {
    describe('by variable name', () => {
      let shader: WebGpuShaderModule

      beforeEach(async () => {
        shader = device.createShaderModule({
          wgsl: /* wgsl */ `
            ${SHADER_BASE}

            struct MaterialBlock {
              baseColor: vec4<f32>,
              roughness: f32,
            }

            @group(0) @binding(0) var<uniform> material: MaterialBlock;
          `,
        })
        await shader.ready
      })

      it('resolves the block itself', () => {
        expect(shader.program.get('material')).not.toBeNull()
      })

      it('resolves a member by field name', () => {
        expect(shader.program.get('material.baseColor')).not.toBeNull()
        expect(shader.program.get('material.roughness')).not.toBeNull()
      })

      it('resolution is case-insensitive on the block name', () => {
        expect(shader.program.get('Material')).not.toBeNull()
        expect(shader.program.get('MATERIAL')).not.toBeNull()
      })

      it('resolution is case-insensitive on the member name', () => {
        expect(shader.program.get('material.BaseColor')).not.toBeNull()
        expect(shader.program.get('material.BASECOLOR')).not.toBeNull()
      })
    })

    describe('by @block and @alias annotations', () => {
      let shader: WebGpuShaderModule

      beforeEach(async () => {
        shader = device.createShaderModule({
          wgsl: /* wgsl */ `
            ${SHADER_BASE}

            struct MaterialBlock {
              // @alias baseColor
              col: vec4<f32>,
              roughness: f32,
            }

            // @block material
            @group(0) @binding(0) var<uniform> p_material: MaterialBlock;
          `,
        })
        await shader.ready
      })

      it('resolves block by @block annotation, not variable name', () => {
        expect(shader.program.get('material')).not.toBeNull()
        expect(shader.program.get('p_material')).toBeNull()
      })

      it('resolves member by @alias annotation, not field name', () => {
        expect(shader.program.get('material.baseColor')).not.toBeNull()
        expect(shader.program.get('material.col')).toBeNull()
      })

      it('@block and @alias resolution is case-insensitive', () => {
        expect(shader.program.get('Material.BaseColor')).not.toBeNull()
      })
    })
  })

  describe('multiple blocks', () => {
    let shader: WebGpuShaderModule

    beforeEach(async () => {
      shader = device.createShaderModule({
        wgsl: /* wgsl */ `
          ${SHADER_BASE}

          struct ViewBlock {
            viewMatrix: mat4x4<f32>,
            // @alias cameraPosition
            camPos: vec3<f32>,
          }

          struct ObjectBlock {
            modelMatrix: mat4x4<f32>,
          }

          // @block view
          @group(0) @binding(0) var<uniform> p_view: ViewBlock;

          // @block object
          @group(0) @binding(1) var<uniform> p_object: ObjectBlock;
        `,
      })
      await shader.ready
    })

    it('resolves each block independently', () => {
      expect(shader.program.get('object')).not.toBeNull()
      expect(shader.program.get('view')).not.toBeNull()
    })

    it('resolves members in their respective blocks', () => {
      expect(shader.program.get('view.viewMatrix')).not.toBeNull()
      expect(shader.program.get('object.modelMatrix')).not.toBeNull()
    })

    it('does not resolve a member across the wrong block', () => {
      expect(shader.program.get('object.viewMatrix')).toBeNull()
      expect(shader.program.get('view.modelMatrix')).toBeNull()
    })

    it('resolves aliased member by @alias, not field name', () => {
      expect(shader.program.get('view.cameraPosition')).not.toBeNull()
      expect(shader.program.get('view.camPos')).toBeNull()
    })
  })

  describe('textures and samplers', () => {
    describe('by variable name', () => {
      let shader: WebGpuShaderModule

      beforeEach(async () => {
        shader = device.createShaderModule({
          wgsl: /* wgsl */ `
            ${SHADER_BASE}

            @group(0) @binding(0) var baseColorMap: texture_2d<f32>;
            @group(0) @binding(1) var defaultSampler: sampler;
          `,
        })
        await shader.ready
      })

      it('resolves a bare texture by variable name', () => {
        expect(shader.program.get('baseColorMap')).not.toBeNull()
      })

      it('resolves a bare sampler by variable name', () => {
        expect(shader.program.get('defaultSampler')).not.toBeNull()
      })
    })

    describe('with @block and @alias annotations', () => {
      let shader: WebGpuShaderModule

      beforeEach(async () => {
        shader = device.createShaderModule({
          wgsl: /* wgsl */ `
            ${SHADER_BASE}

            // @block material
            // @alias baseColorMap
            @group(0) @binding(0) var t_base: texture_2d<f32>;

            // @block material
            // @alias defaultSampler
            @group(0) @binding(1) var s_base: sampler;
          `,
        })
        await shader.ready
      })

      it('resolves texture by block.alias', () => {
        expect(shader.program.get('material.baseColorMap')).not.toBeNull()
        expect(shader.program.get('material.defaultSampler')).not.toBeNull()
      })

      it('does not resolve texture by alias only', () => {
        expect(shader.program.get('baseColorMap')).toBeNull()
        expect(shader.program.get('defaultSampler')).toBeNull()
      })

      it('does resolve texture by variable name', () => {
        expect(shader.program.get('t_base')).not.toBeNull()
        expect(shader.program.get('s_base')).not.toBeNull()
      })

      it('does not resolve texture under wrong block prefix', () => {
        expect(shader.program.get('object.baseColorMap')).toBeNull()
      })
    })
  })

  describe('array indexing', () => {
    let shader: WebGpuShaderModule

    beforeEach(async () => {
      shader = device.createShaderModule({
        wgsl: /* wgsl */ `
          ${SHADER_BASE}

          struct BoneBlock {
            matrices: array<mat4x4<f32>, 64>,
          }

          @group(0) @binding(0) var<uniform> bones: BoneBlock;
          @group(0) @binding(1) var<uniform> transforms: array<mat4x4<f32>, 8>;
        `,
      })
      await shader.ready
    })

    it('resolves an indexed array member', () => {
      expect(shader.program.get('bones.matrices[0]')).not.toBeNull()
      expect(shader.program.get('bones.matrices[63]')).not.toBeNull()
    })

    it('resolves an array member without index', () => {
      expect(shader.program.get('bones.matrices')).not.toBeNull()
    })

    it('resolves an indexed array resource', () => {
      expect(shader.program.get('transforms[0]')).not.toBeNull()
      expect(shader.program.get('transforms[7]')).not.toBeNull()
    })

    it('resolves an array resource without index', () => {
      expect(shader.program.get('transforms')).not.toBeNull()
    })
  })

  describe('resolved input metadata', () => {
    let shader: WebGpuShaderModule

    beforeEach(async () => {
      shader = device.createShaderModule({
        wgsl: /* wgsl */ `
          ${SHADER_BASE}

          struct MaterialBlock {
            baseColor: vec4<f32>,
            roughness: f32,
          }

          @group(0) @binding(0) var<uniform> material: MaterialBlock;
          @group(0) @binding(1) var baseColorMap: texture_2d<f32>;
          @group(0) @binding(2) var defaultSampler: sampler;
        `,
      })
      await shader.ready
    })

    it('reports correct type for a vec4 member', () => {
      expect(shader.program.get('material.baseColor').type).toBe('vec4')
    })

    it('reports correct type for a scalar member', () => {
      expect(shader.program.get('material.roughness').type).toBe('scalar')
    })

    it('reports correct type for a texture', () => {
      expect(shader.program.get('baseColorMap').type).toBe('texture')
    })

    it('reports correct type for a sampler', () => {
      expect(shader.program.get('defaultSampler').type).toBe('sampler')
    })

    it('reports correct group for each binding', () => {
      expect(shader.program.get('material').group).toBe(0)
      expect(shader.program.get('baseColorMap').group).toBe(0)
      expect(shader.program.get('defaultSampler').group).toBe(0)
    })

    it('reports correct binding index for each resource', () => {
      expect(shader.program.get('material').binding).toBe(0)
      expect(shader.program.get('baseColorMap').binding).toBe(1)
      expect(shader.program.get('defaultSampler').binding).toBe(2)
    })
  })
})
