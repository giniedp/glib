import { Random } from './types'

export class MT19937 implements Random {
  private static readonly N = 624
  private static readonly M = 397
  private static readonly MATRIX_A = 0x9908b0df
  private static readonly UPPER_MASK = 0x80000000
  private static readonly LOWER_MASK = 0x7fffffff

  private mt: number[] = new Array(MT19937.N)
  private index = MT19937.N

  constructor(seed: number) {
    this.seed(seed)
  }

  seed(seed: number) {
    this.mt[0] = seed >>> 0

    for (let i = 1; i < MT19937.N; i++) {
      const prev = this.mt[i - 1]
      this.mt[i] = (Math.imul(1812433253, prev ^ (prev >>> 30)) + i) >>> 0
    }

    this.index = MT19937.N
  }

  private twist() {
    for (let i = 0; i < MT19937.N; i++) {
      const y = (this.mt[i] & MT19937.UPPER_MASK) | (this.mt[(i + 1) % MT19937.N] & MT19937.LOWER_MASK)

      let xA = y >>> 1
      if (y & 1) {
        xA ^= MT19937.MATRIX_A
      }

      this.mt[i] = this.mt[(i + MT19937.M) % MT19937.N] ^ xA
    }

    this.index = 0
  }

  next(): number {
    if (this.index >= MT19937.N) {
      this.twist()
    }

    let y = this.mt[this.index++]

    // Tempering
    y ^= y >>> 11
    y ^= (y << 7) & 0x9d2c5680
    y ^= (y << 15) & 0xefc60000
    y ^= y >>> 18

    return y >>> 0
  }

  nextFloat(): number {
    return this.next() / 0x100000000
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min)) + min
  }
}
