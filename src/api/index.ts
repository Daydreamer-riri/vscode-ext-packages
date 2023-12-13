import NodeCache from 'node-cache'
import type Item from '../core/Item'
import { now, ttl } from '../utils/ttl'
import { dumpCache, loadCache } from './cache'
import { version } from './version'
import { protocolDep } from './utils'

export const freshChecker = {
  needFresh: true,
  set(newVal: boolean) {
    this.needFresh = newVal
  },
}

const cacheInit = Object.entries(loadCache())
const init = cacheInit.map(([key, { cacheTime, data }]) => {
  return {
    key,
    val: data,
    ttl: ttl(cacheTime),
  }
})
const cache = new NodeCache({ stdTTL: 60 * 10 })
cache.mset(init)
// const cacheTTL = 30 * 60_000 // 30min

let cacheChanged = false

export interface PackageData {
  version: string[]
  info?: string
}

export async function getPackageData(item: Item, root: string): Promise<PackageData> {
  const preTest = protocolDep(item)
  if (preTest)
    return preTest

  const name = item.key

  const cacheData: string[] | undefined = cache.get(name)
  if (cacheData) {
    console.log('vscode-packages: use cache', name)

    if (freshChecker.needFresh) {
      setTimeout(() => {
        reGetVersion(name, root)
      }, 10000)
    }

    return { version: cacheData }
  }

  const version = await reGetVersion(name, root)
  console.log('vscode-packages: fetch', name)
  console.log('ttl', cache.getTtl(name))

  return {
    version,
  }
}

async function reGetVersion(name: string, root: string) {
  try {
    const data = await version(name, root)

    if (data) {
      cache.set(name, data)
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
  const cacheContent: any = cache.mget(cache.keys())
  dumpCache(cacheContent, cacheChanged)
}
