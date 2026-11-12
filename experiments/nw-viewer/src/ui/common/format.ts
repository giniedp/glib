/**
 * A byte count for people: `512 B`, `1.5 KiB`, `12.3 MiB`, `1.25 GiB`
 */
export function formatBytes(n: number): string {
  if (n < 1024) {
    return `${n} B`
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KiB`
  }
  if (n < 1024 * 1024 * 1024) {
    return `${(n / 1024 / 1024).toFixed(1)} MiB`
  }
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GiB`
}
