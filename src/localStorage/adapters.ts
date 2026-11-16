import { toRaw } from 'vue'
import type { StorageAdapter } from './types'

export function createMemoryAdapter(): StorageAdapter {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
  }
}

export function resolveDefaultAdapter(): StorageAdapter {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage
  }
  return createMemoryAdapter()
}

export function cloneValue<V>(value: V): V {
  if (value === null || typeof value !== 'object') {
    return value
  }
  const raw = toRaw(value)
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(raw)
    } catch {
      // Fallback para Proxies reativos aninhados do Vue que structuredClone não clona
    }
  }
  return JSON.parse(JSON.stringify(raw)) as V
}