import { proceduralProgram } from './base';
import { glsl, ShaderEffect, Device, createShaderEffectSync } from '@gglib/graphics';


export function brickProgram() {
  return proceduralProgram({}, [{
    uniforms: glsl`
      // @default 0.25
      uniform float brickWidth;
      // @default 0.08
      uniform float brickHeight;
      // @default 0.01
      uniform float mortarThickness;
      // @default [0.5, 0.5, 0.5]
      uniform vec3 colorMortar;
      // @default [0.5, 0.15, 0.14]
      uniform vec3 colorBrick;
    `,
    fs_main_color: glsl`
      float scoord = point.x;
      float tcoord = point.y;
      float ss = scoord / (brickWidth + mortarThickness);
      float tt = tcoord / (brickHeight + mortarThickness);
      if (mod(tt * 0.5, 1.0) > 0.5) {
        ss += 0.5; // shift alternate rows
      }
      float sbrick = floor(ss);
      float tbrick = floor(tt);
      ss -= sbrick;
      tt -= tbrick;
      float w = step(mortarThickness * 0.5 / (brickWidth + mortarThickness), ss);
      float h = step(mortarThickness * 0.5 / (brickHeight + mortarThickness), tt);
      color.rgb = mix(colorMortar, colorBrick, w * h);
    `
  }])
}

export interface BrickEffectOptions {
  brickWidth?: number
  brickHeight?: number
  mortarThickness?: number
  mortarColor?: number
  brickColor?: number
}

export class BrickEffect {

  public readonly shader: ShaderEffect

  constructor(device: Device, options: BrickEffectOptions) {
    this.shader = device.createEffect({
      program: brickProgram()
    })
  }

  public draw() {
    this.shader.drawQuad()
  }
}
