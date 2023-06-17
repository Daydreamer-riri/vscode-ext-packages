import { window } from 'vscode'
import type Item from '../core/Item'
import { getWorkspaceFolderPath } from './config'
import { version } from './version'

const cache = new Map<string, { cacheTime: number; data: string[] }>()
const cacheTTL = 30 * 60_000 // 30min
// eslint-disable-next-line unused-imports/no-unused-vars
let cacheChanged = false

function now() {
  return +new Date()
}

function ttl(n: number) {
  return now() - n
}

const workspacePrefix = 'workspace:'

export async function getPackageData(item: Item): Promise<string[]> {
  const name = item.key
  if (item.value.slice(0, 10) === workspacePrefix)
    return [item.value]

  // let error: any
  const cacheData = cache.get(name)
  if (cacheData) {
    if (ttl(cacheData.cacheTime) < cacheTTL) {
      console.log('read cache')
      return cacheData.data
    }

    else {
      cache.delete(name)
    }
  }

  try {
    const root = getWorkspaceFolderPath(window.activeTextEditor)!
    const data = await version(name, root)

    if (data) {
      cache.set(name, { data, cacheTime: now() })

      cacheChanged = true

      return data
    }
  }
  catch (e) {
    console.error(e)
  }

  return []
}
