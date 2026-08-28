import type { AppData } from './types'
import { emptyData } from './types'

const DB_NAME = 'deal-thread-v1'
const STORE = 'app'
const KEY = 'state'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadData(): Promise<AppData> {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).get(KEY)
      request.onsuccess = () => resolve((request.result as AppData | undefined) ?? emptyData())
      request.onerror = () => reject(request.error)
    })
  } catch {
    return emptyData()
  }
}

export async function saveData(value: AppData): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, KEY)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
