import { Sampler } from './types'

import { fractal, FractalOptions, hybridMultifractal, multifractal, rigedMultifractal } from './fractal'
import { scale, shift } from './modifier'

import { DistanceFunc, euclideanDistance, manhattanDistance } from './distance'
import { cellNoise, latticeNoise, LatticeNoiseOptions, perlinNoise, simplexNoise, valueNoise } from './noise'
import { abs, add, clamp, max, min, multiply, negate, sinus, subtract } from './operator'

export class Noise {

  public static lattice(options: LatticeNoiseOptions = {}): Noise {
    return new Noise(latticeNoise(options))
  }

  public static perlin(): Noise {
    return new Noise(perlinNoise())
  }

  public static simplex(): Noise {
    return new Noise(simplexNoise())
  }

  public static value(): Noise {
    return new Noise(valueNoise())
  }

  public static cell(distance: DistanceFunc = manhattanDistance): Noise {
    return new Noise(cellNoise(distance))
  }

  constructor(public sampler: Sampler) {
    //
  }

  //
  // input modifiert
  //

  public scale(...scalar: number[]): this {
    this.sampler = scale(this.sampler, ...scalar)
    return this
  }

  public shift(...scalar: number[]): this {
    this.sampler = shift(this.sampler, ...scalar)
    return this
  }

  //
  // fractal
  //

  public fractal(options: FractalOptions = {}): this {
    this.sampler = fractal(this.sampler, options)
    return this
  }

  public hybridMultifractal(options: FractalOptions = {}): this {
    this.sampler = hybridMultifractal(this.sampler, options)
    return this
  }

  public multifractal(options: FractalOptions = {}): this {
    this.sampler = multifractal(this.sampler, options)
    return this
  }

  public rigedMultifractal(options: FractalOptions = {}): this {
    this.sampler = rigedMultifractal(this.sampler, options)
    return this
  }

  //
  // operators
  //

  public abs(): this {
    this.sampler = abs(this.sampler)
    return this
  }

  public negate(): this {
    this.sampler = negate(this.sampler)
    return this
  }

  public add(...other: Array<Sampler | number>): this {
    this.sampler = add(this.sampler, ...other)
    return this
  }

  public sinus(offset: Sampler | number = 0): this {
    this.sampler = sinus(this.sampler, offset)
    return this
  }

  public subtract(...other: Array<Sampler | number>): this {
    this.sampler = subtract(this.sampler, ...other)
    return this
  }

  public clamp(minVal: Sampler | number, maxVal: Sampler | number): this {
    this.sampler = clamp(this.sampler, minVal, maxVal)
    return this
  }

  public max(...other: Array<Sampler | number>): this {
    this.sampler = max(this.sampler, ...other)
    return this
  }

  public min(...other: Array<Sampler | number>): this {
    this.sampler = min(this.sampler, ...other)
    return this
  }

  public multiply(...other: Array<Sampler | number>): this {
    this.sampler = multiply(this.sampler, ...other)
    return this
  }
}
