import { effectScope, inject, ref, watch, type App, type Ref } from 'vue'
import { cloneValue, resolveDefaultAdapter } from './adapters'
import { SISTEC_STORAGE_INJECTION_KEY, SISTEC_STORAGE_PREFIX } from './constants'
import type { SistecStorage, SistecStorageOptions, StorageAdapter } from './types'

const registeredAppsByAdapter = new WeakMap<StorageAdapter, Set<string>>()

function registerAppName(adapter: StorageAdapter, appName: string): void {
  let registered = registeredAppsByAdapter.get(adapter)
  if (!registered) {
    registered = new Set<string>()
    registeredAppsByAdapter.set(adapter, registered)
  }

  if (registered.has(appName)) {
    throw new Error(
      `[sistec-localstorage] A aplicação "${appName}" já foi registrada. Exporte e reutilize uma única instância por aplicação.`,
    )
  }

  registered.add(appName)
}

export function createSistecStorage<T extends Record<string, unknown>>(
  options: SistecStorageOptions<T>,
): SistecStorage<T> {
  const appName = options.appName?.trim()
  if (!appName) {
    throw new Error('[sistec-localstorage] "appName" é obrigatório e não pode ser vazio.')
  }

  if (!options.defaults || typeof options.defaults !== 'object' || Array.isArray(options.defaults)) {
    throw new Error('[sistec-localstorage] "defaults" deve ser um objeto com as chaves da aplicação.')
  }

  const allowedKeys = Object.keys(options.defaults) as Array<keyof T & string>
  if (allowedKeys.length === 0) {
    throw new Error('[sistec-localstorage] Informe pelo menos uma chave em "defaults".')
  }

  const adapter = options.adapter ?? resolveDefaultAdapter()
  registerAppName(adapter, appName)

  const allowedKeySet = new Set<string>(allowedKeys)
  const storageKey = `${SISTEC_STORAGE_PREFIX}${appName}`
  const syncTabs = options.syncTabs ?? true
  const reactiveRefs = new Map<string, Ref<unknown>>()
  const watcherScope = effectScope(true)
  let isInternalUpdate = false

  function assertAllowedKey(key: string): asserts key is keyof T & string {
    if (!allowedKeySet.has(key)) {
      throw new Error(
        `[sistec-localstorage] Chave "${key}" não está configurada para "${appName}". Chaves permitidas: ${allowedKeys.join(', ')}.`,
      )
    }
  }

  function buildDefaultsSnapshot(): T {
    const snapshot = {} as T
    for (const key of allowedKeys) {
      snapshot[key] = cloneValue(options.defaults[key])
    }
    return snapshot
  }

  function readState(): T {
    const snapshot = buildDefaultsSnapshot()
    const raw = adapter.getItem(storageKey)
    if (!raw) {
      return snapshot
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const key of allowedKeys) {
          if (Object.prototype.hasOwnProperty.call(parsed, key)) {
            snapshot[key] = cloneValue(parsed[key]) as T[keyof T & string]
          }
        }
      }
    } catch {
      // Se o JSON armazenado estiver corrompido, mantém os valores padrão
    }

    return snapshot
  }

  function writeState(state: T): void {
    const filtered = {} as T
    for (const key of allowedKeys) {
      filtered[key] = cloneValue(state[key])
    }
    adapter.setItem(storageKey, JSON.stringify(filtered))
  }

  function syncRefsFromState(state: T): void {
    isInternalUpdate = true
    try {
      for (const [key, stateRef] of reactiveRefs.entries()) {
        stateRef.value = cloneValue(state[key as keyof T & string])
      }
    } finally {
      isInternalUpdate = false
    }
  }

  // Aloca imediatamente o namespace no localStorage ao registrar a aplicação
  const initialState = readState()
  writeState(initialState)

  if (syncTabs && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === storageKey) {
        syncRefsFromState(readState())
      }
    })
  }

  const instance: SistecStorage<T> = {
    storageKey,
    appName,
    allowedKeys,

    has(key: string): key is keyof T & string {
      return allowedKeySet.has(key)
    },

    get<K extends keyof T & string>(key: K): T[K] {
      assertAllowedKey(key)
      return readState()[key]
    },

    set<K extends keyof T & string>(key: K, value: T[K]): void {
      assertAllowedKey(key)
      const state = readState()
      state[key] = cloneValue(value)
      writeState(state)

      const existingRef = reactiveRefs.get(key)
      if (existingRef) {
        isInternalUpdate = true
        try {
          existingRef.value = cloneValue(value)
        } finally {
          isInternalUpdate = false
        }
      }
    },

    remove<K extends keyof T & string>(key: K): void {
      assertAllowedKey(key)
      const defaultValue = cloneValue(options.defaults[key])
      instance.set(key, defaultValue)
    },

    clear(): void {
      const defaultsSnapshot = buildDefaultsSnapshot()
      writeState(defaultsSnapshot)
      syncRefsFromState(defaultsSnapshot)
    },

    getAll(): T {
      return readState()
    },

    use<K extends keyof T & string>(key: K): Ref<T[K]> {
      assertAllowedKey(key)

      const cached = reactiveRefs.get(key)
      if (cached) {
        return cached as Ref<T[K]>
      }

      const stateRef = ref(readState()[key]) as Ref<T[K]>
      reactiveRefs.set(key, stateRef as Ref<unknown>)

      // Escopo destacado evita que o watch morra quando o primeiro componente que chamou use() desmontar
      watcherScope.run(() => {
        watch(
          stateRef,
          (newValue) => {
            if (isInternalUpdate) return
            const state = readState()
            state[key] = cloneValue(newValue)
            writeState(state)
          },
          { deep: true, flush: 'sync' },
        )
      })

      return stateRef
    },

    install(app: App): void {
      app.provide(
        SISTEC_STORAGE_INJECTION_KEY,
        instance as unknown as SistecStorage<Record<string, unknown>>,
      )
    },
  }

  return instance
}

/** Recupera a instância registrada via `app.use(storage)` dentro de um componente Vue */
export function useSistecStorage<T extends Record<string, unknown>>(): SistecStorage<T> {
  const storage = inject(SISTEC_STORAGE_INJECTION_KEY)
  if (!storage) {
    throw new Error(
      '[sistec-localstorage] Nenhuma instância encontrada. Registre com app.use(storage) ou importe a instância diretamente.',
    )
  }
  return storage as unknown as SistecStorage<T>
}