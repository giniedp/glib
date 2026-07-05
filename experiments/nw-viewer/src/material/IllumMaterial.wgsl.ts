import { ILLUM_SHADER_BASE } from './IllumBase.wgsl'

export default /* wgsl */ `

${ILLUM_SHADER_BASE}

@vertex
fn vs_main(input : VertexInputNoColor) -> FragmentInput {
  var in: VertexInput;
  in.id = input.id;
  in.position = input.position;
  in.texture = input.texture;
  in.normal = input.normal;
  in.tangent = input.tangent;
  in.color = vec4f(0.0, 0.0, 0.0, 1.0);

  return illumVS(in);
}

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  return illumFS(input);
}

`
