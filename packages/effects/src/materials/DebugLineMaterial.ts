import { CommonBlocks, CommonInputs, DepthState, MaterialOptions, MaterialWithSchema } from '@gglib/graphics'
import { mat4Identity } from '@gglib/math'

export const DebugLineMaterialSchema = {
  ObjectModel: CommonInputs.Object.ModelMatrix,
}

/**
 * Options for {@link DebugLineMaterial}
 *
 * @public
 */
export interface DebugLineMaterialParams {
  /**
   * If `false`, the lines are drawn on top of everything. Defaults to `true`
   */
  depthTest?: boolean
}

const WGSL = /* wgsl */ `
  struct ViewBlock {
    viewProjectionMatrix: mat4x4f,
  };

  struct ObjectBlock {
    modelMatrix: mat4x4f,
  };

  @group(0) @binding(0) var<uniform> view: ViewBlock;
  @group(0) @binding(1) var<uniform> object: ObjectBlock;

  struct VertexInput {
    // @alias position
    @location(0) position: vec3f,
    // @alias color
    @location(1) color: vec4f,
  }

  struct FragmentInput {
    @builtin(position) position : vec4f,
    @location(0) color : vec4f,
  }

  @vertex
  fn vs_main(input: VertexInput) -> FragmentInput {
    var output: FragmentInput;
    output.position = view.viewProjectionMatrix * object.modelMatrix * vec4f(input.position, 1.0);
    output.color = input.color;
    return output;
  }

  @fragment
  fn fs_main(input: FragmentInput) -> @location(0) vec4f {
    return vec4f(input.color.rgb, 1.0);
  }
`

const GLSL_VS = /* glsl */ `#version 300 es
  precision highp float;
  precision highp int;

  // @block view
  layout(std140) uniform View {
    mat4 viewProjectionMatrix;
  } view;

  // @block object
  layout(std140) uniform Object {
    mat4 modelMatrix;
  } object;

  // @alias position
  in vec3 aPosition;
  // @alias color
  in vec4 aColor;

  out vec4 vColor;

  void main() {
    vColor = aColor;
    gl_Position = view.viewProjectionMatrix * object.modelMatrix * vec4(aPosition, 1.0);
  }
`

const GLSL_FS = /* glsl */ `#version 300 es
  precision highp float;
  precision highp int;

  in vec4 vColor;
  out vec4 fragColor;

  void main() {
    fragColor = vec4(vColor.rgb, 1.0);
  }
`

/**
 * An unlit material that renders the vertex color, used for debug lines
 *
 * @public
 * @remarks
 * Expects a `position` and a `color` vertex attribute.
 */
export class DebugLineMaterial extends MaterialWithSchema(DebugLineMaterialSchema) {
  protected override configure(options: Partial<MaterialOptions>): void {
    const params = options?.properties as DebugLineMaterialParams
    super.configure({
      name: 'Debug Line Material',
      effect: {
        name: 'Debug Line Effect',
        depthState: params?.depthTest === false ? DepthState.Disabled : undefined,
        program: {
          // the view block is provided by the renderer
          sharedBlocks: [CommonBlocks.View],
          shader: {
            name: 'Debug Line Shader',
            wgsl: { source: WGSL },
            glsl: { vertex: GLSL_VS, fragment: GLSL_FS },
          },
        },
      },
    })
    this.ObjectModel = mat4Identity()
  }
}
