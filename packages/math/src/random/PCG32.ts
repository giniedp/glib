import { Random } from './types'

export class PCG32 implements Random {
  private stateHi: number
  private stateLo: number
  private incHi: number
  private incLo: number

  constructor(seedHi: number, seedLo: number, seqHi = 0, seqLo = 54) {
    this.stateHi = 0
    this.stateLo = 0

    // increment must be odd
    this.incHi = (seqHi << 1) | (seqLo >>> 31)
    this.incLo = (seqLo << 1) | 1

    this.next() // warm up

    this.add64(seedHi, seedLo)
    this.next()
  }

  // 64-bit addition
  private add64(hi: number, lo: number) {
    const loSum = (this.stateLo + lo) >>> 0
    const carry = loSum < this.stateLo ? 1 : 0
    this.stateHi = (this.stateHi + hi + carry) >>> 0
    this.stateLo = loSum
  }

  // 64-bit multiply: (a * b) mod 2^64
  private mul64(aHi: number, aLo: number, bHi: number, bLo: number): [number, number] {
    const lo = Math.imul(aLo, bLo)
    const mid1 = Math.imul(aHi, bLo)
    const mid2 = Math.imul(aLo, bHi)
    const hi = (Math.imul(aHi, bHi) + (mid1 >>> 0) + (mid2 >>> 0) + ((lo / 0x100000000) >>> 0)) >>> 0

    return [hi >>> 0, lo >>> 0]
  }

  next(): number {
    const oldHi = this.stateHi
    const oldLo = this.stateLo

    // multiplier = 6364136223846793005
    const MUL_HI = 0x5851f42d
    const MUL_LO = 0x4c957f2d

    const [mulHi, mulLo] = this.mul64(oldHi, oldLo, MUL_HI, MUL_LO)

    // state = state * multiplier + increment
    const lo = (mulLo + this.incLo) >>> 0
    const carry = lo < mulLo ? 1 : 0
    const hi = (mulHi + this.incHi + carry) >>> 0

    this.stateHi = hi
    this.stateLo = lo

    // output transformation (XSH RR)
    const xorshifted = (((oldHi >>> 18) ^ oldHi) >>> 27) >>> 0
    const rot = oldHi >>> 27

    return ((xorshifted >>> rot) | (xorshifted << (-rot & 31))) >>> 0
  }

  nextFloat(): number {
    return this.next() / 0x100000000
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min)) + min
  }
}
