import Item from '../core/Item'

const DEV_DEPS = 'devDependencies'
const DEPS = 'dependencies'
export const RE_VERSION = /^[ \t]*"(\S+?)"([ \t]*:[ \t]*)(")(.*?)\3/

export function parseJson(text: string) {
  const pkg = JSON.parse(text)
  const deps = { ...(pkg[DEPS] ?? {}), ...(pkg[DEV_DEPS] ?? {}) }
  const depNames = Object.keys(deps)
  const depItems = depNames.map((name) => {
    const reg = new RegExp(`"${name}".*,?`)
    const match = reg.exec(text)
    if (!match)
      throw new Error('Can\'t find deps')

    const startInline = match[0].indexOf('"', name.length + 2)
    const endInline = match[0].indexOf('"', startInline + 1)

    return new Item({
      key: name,
      value: deps[name],
      start: match.index + startInline,
      end: match.index + endInline,
      values: [],
    })
  })
  return depItems
}
