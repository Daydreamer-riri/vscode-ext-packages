import Item from '../core/Item'

const DEV_DEPS = 'devDependencies'
const DEPS = 'dependencies'
export const RE_VERSION = /^[ \t]*"(\S+?)"([ \t]*:[ \t]*)(")(.*?)\3/

const depFieldsRe = /"(devD|d)ependencies"[ \t]*:[ \t]*{[\s\S]*?}/g

export function parseJson(text: string) {
  const pkg = JSON.parse(text)
  const deps = { ...(pkg[DEPS] ?? {}), ...(pkg[DEV_DEPS] ?? {}) }
  const depNames = Object.keys(deps)

  const depfieldsMatchs = text.matchAll(depFieldsRe)
  const ranges = [...depfieldsMatchs].map((match) => {
    const start = match.index ?? 0
    const end = start + match[0].length
    return { start, end }
  })

  const reg = new RegExp(`"(${depNames.join('|')})"([ \\t]*:[ \\t]*)(")(.*?)\\3`, 'g')

  const matchs = text.matchAll(reg)
  const validMatchs = [...matchs].filter((match) => {
    const { index } = match
    return index !== undefined
      && ranges.some(
        range => index > range.start && index < range.end,
      )
  })
  const items = validMatchs.map((match) => {
    const [origin, key, mid, _, value] = match
    const start = (match.index ?? 0) + key.length + mid.length + 2
    const end = (match.index ?? 0) + origin.length
    return new Item({
      key,
      value,
      start,
      end,
      values: [],
    })
  })

  return items
}
