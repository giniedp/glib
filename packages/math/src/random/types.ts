export interface Random {
  next(): number
  nextFloat(): number
  nextInt(min: number, max: number): number
}
