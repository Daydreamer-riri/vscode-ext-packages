export function createReg(regRaw: string) {
  const [_raw, _prefix, reg, flags] = String(regRaw).match(/(\/?)(.+)\1([a-z]*)/i)!
  return new RegExp(reg, flags)
}
