import { getPackageData } from '../api'
import type Item from './Item'

export async function getPackageDatas(dependencies: Item[], root: string) {
  const datas = await Promise.all(dependencies.map(item => getPackageData(item, root)))
  return datas
}
