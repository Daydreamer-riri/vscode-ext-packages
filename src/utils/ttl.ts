export function now() {
  return +new Date()
}

export function ttl(n: number) {
  return now() - n
}
