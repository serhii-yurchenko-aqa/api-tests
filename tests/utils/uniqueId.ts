export function uniqueId(): number {
  return Math.floor(Date.now() % 1_000_000_000 + Math.random() * 1000);
}
