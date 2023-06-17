import { window } from 'vscode'
import type Item from '../core/Item'
import { now, ttl } from '../utils/ttl'
import { getWorkspaceFolderPath } from '../utils/resolve'
import { dumpCache, loadCache } from './cache'
import { version } from './version'

const cacheInit = Object.entries(loadCache())
const cache = new Map<string, { cacheTime: number; data: string[] }>(cacheInit)
const cacheTTL = 30 * 60_000 // 30min

let cacheChanged = false

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
    }
    else {
      // cache.delete(name)
      reGetVersion(name)
    }
    return cacheData.data
  }

  return await reGetVersion(name)
}

async function reGetVersion(name: string) {
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

export function saveCache() {
  const cacheContent = Object.fromEntries(cache.entries())
  delete cacheContent.next
  dumpCache(cacheContent, cacheChanged)
}
