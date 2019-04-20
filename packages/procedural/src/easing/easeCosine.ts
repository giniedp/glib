export function easeCosine(t: number): number {
  return (1 - Math.cos(t * Math.PI) * 0.5)
}
