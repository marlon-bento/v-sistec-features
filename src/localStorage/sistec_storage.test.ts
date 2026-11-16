// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { effectScope, nextTick, reactive } from 'vue'
import { createSistecStorage, SISTEC_STORAGE_PREFIX, type StorageAdapter } from './index'

function createMockLocalStorage(): StorageAdapter & { rawStore: Map<string, string> } {
  const rawStore = new Map<string, string>()
  return {
    rawStore,
    getItem: (key) => rawStore.get(key) ?? null,
    setItem: (key, value) => {
      rawStore.set(key, value)
    },
    removeItem: (key) => {
      rawStore.delete(key)
    },
  }
}

describe('createSistecStorage', () => {
  let mockAdapter: ReturnType<typeof createMockLocalStorage>

  beforeEach(() => {
    mockAdapter = createMockLocalStorage()
  })

  it('aloca automaticamente a chave sistec-localstorage:${appName} com os valores padrão', () => {
    const storage = createSistecStorage({
      appName: 'portal-icei',
      defaults: {
        theme: 'light' as 'light' | 'dark',
        sidebarOpen: true,
      },
      adapter: mockAdapter,
    })

    expect(storage.storageKey).toBe(`${SISTEC_STORAGE_PREFIX}portal-icei`)
    expect(mockAdapter.getItem('sistec-localstorage:portal-icei')).toBe(
      JSON.stringify({ theme: 'light', sidebarOpen: true }),
    )
  })

  it('valida appName e defaults obrigatórios na criação', () => {
    expect(() =>
      createSistecStorage({
        appName: '   ',
        defaults: { theme: 'light' },
        adapter: mockAdapter,
      }),
    ).toThrow(/appName/)

    expect(() =>
      createSistecStorage({
        appName: 'meu-app',
        defaults: {},
        adapter: mockAdapter,
      }),
    ).toThrow(/defaults/)
  })

  it('bloqueia o registro duplicado do mesmo appName no mesmo adapter', () => {
    createSistecStorage({
      appName: 'sistec',
      defaults: { theme: 'light' },
      adapter: mockAdapter,
    })

    expect(() =>
      createSistecStorage({
        appName: 'sistec',
        defaults: { theme: 'dark' },
        adapter: mockAdapter,
      }),
    ).toThrow(/já foi registrada/)
  })

  it('isola os dados por aplicação sem misturar sistemas diferentes', () => {
    const appA = createSistecStorage({
      appName: 'sistema-a',
      defaults: { theme: 'light', token: '' },
      adapter: mockAdapter,
    })

    const appB = createSistecStorage({
      appName: 'sistema-b',
      defaults: { theme: 'dark', pageSize: 20 },
      adapter: mockAdapter,
    })

    appA.set('theme', 'dark')
    appA.set('token', 'abc-123')
    appB.set('theme', 'light')

    expect(appA.get('theme')).toBe('dark')
    expect(appA.get('token')).toBe('abc-123')
    expect(appB.get('theme')).toBe('light')
    expect(appB.get('pageSize')).toBe(20)
  })

  it('bloqueia leitura, escrita, remoção e use() em chaves não configuradas', () => {
    const storage = createSistecStorage({
      appName: 'meu-sistema',
      defaults: { theme: 'light' },
      adapter: mockAdapter,
    })

    expect(storage.has('theme')).toBe(true)
    expect(storage.has('naoExiste')).toBe(false)

    // @ts-expect-error testando bloqueio em runtime para chave não configurada
    expect(() => storage.set('naoExiste', '123')).toThrow(/não está configurada/)
    // @ts-expect-error testando bloqueio em runtime para chave não configurada
    expect(() => storage.get('naoExiste')).toThrow(/não está configurada/)
    // @ts-expect-error testando bloqueio em runtime para chave não configurada
    expect(() => storage.remove('naoExiste')).toThrow(/não está configurada/)
    // @ts-expect-error testando bloqueio em runtime para chave não configurada
    expect(() => storage.use('naoExiste')).toThrow(/não está configurada/)

    expect(storage.getAll()).toEqual({ theme: 'light' })
  })

  it('ignora chaves extras injetadas manualmente no localStorage', () => {
    mockAdapter.setItem(
      'sistec-localstorage:app-seguro',
      JSON.stringify({ theme: 'dark', intruso: 'valor-invalido' }),
    )

    const storage = createSistecStorage({
      appName: 'app-seguro',
      defaults: { theme: 'light' },
      adapter: mockAdapter,
    })

    expect(storage.getAll()).toEqual({ theme: 'dark' })
    expect(mockAdapter.getItem('sistec-localstorage:app-seguro')).toBe(
      JSON.stringify({ theme: 'dark' }),
    )
  })

  it('reseta chave individual com remove() e todas com clear()', () => {
    const storage = createSistecStorage({
      appName: 'app-reset',
      defaults: { theme: 'light', itemsPerPage: 10 },
      adapter: mockAdapter,
    })

    storage.set('theme', 'dark')
    storage.set('itemsPerPage', 50)
    expect(storage.getAll()).toEqual({ theme: 'dark', itemsPerPage: 50 })

    storage.remove('theme')
    expect(storage.get('theme')).toBe('light')
    expect(storage.get('itemsPerPage')).toBe(50)

    storage.clear()
    expect(storage.getAll()).toEqual({ theme: 'light', itemsPerPage: 10 })
  })

  it('mantém reatividade Vue 3 com storage.use() e persiste alterações automaticamente', async () => {
    const storage = createSistecStorage({
      appName: 'vue-app',
      defaults: {
        theme: 'light',
        filters: { status: 'all', page: 1 },
      },
      adapter: mockAdapter,
    })

    const themeRefA = storage.use('theme')
    const themeRefB = storage.use('theme')
    const filtersRef = storage.use('filters')

    expect(themeRefA.value).toBe('light')
    expect(themeRefA).toBe(themeRefB)

    themeRefA.value = 'dark'
    await nextTick()
    expect(storage.get('theme')).toBe('dark')
    expect(themeRefB.value).toBe('dark')

    // Alteração profunda em objeto também persiste
    filtersRef.value.page = 3
    await nextTick()
    expect(storage.get('filters')).toEqual({ status: 'all', page: 3 })

    // Alteração imperativa atualiza a Ref reativa
    storage.set('theme', 'light')
    expect(themeRefA.value).toBe('light')
  })

  it('mantém o watch ativo mesmo após o primeiro componente que chamou use() desmontar', async () => {
    const storage = createSistecStorage({
      appName: 'scope-app',
      defaults: { theme: 'light' },
      adapter: mockAdapter,
    })

    const componentScope = effectScope()
    componentScope.run(() => {
      storage.use('theme')
    })

    // Simula o componente desmontando
    componentScope.stop()

    const themeRef = storage.use('theme')
    themeRef.value = 'dark'
    await nextTick()

    expect(storage.get('theme')).toBe('dark')
  })

  it('persiste objetos reativos aninhados (Proxy do Vue) sem lançar DataCloneError', () => {
    const storage = createSistecStorage({
      appName: 'proxy-app',
      defaults: {
        themes: { theme: 'light', nested: { primary: 'green' } },
      },
      adapter: mockAdapter,
    })

    const reactiveThemes = reactive({ theme: 'dark', nested: { primary: 'blue' } })
    storage.set('themes', reactiveThemes)

    expect(storage.get('themes')).toEqual({ theme: 'dark', nested: { primary: 'blue' } })
  })

  it('recupera de JSON corrompido no localStorage usando os defaults', () => {
    mockAdapter.setItem('sistec-localstorage:corrompido', '{json-invalido')

    const storage = createSistecStorage({
      appName: 'corrompido',
      defaults: { theme: 'light' },
      adapter: mockAdapter,
    })

    expect(storage.get('theme')).toBe('light')
  })

  it('sincroniza alterações entre abas quando ocorre evento storage no window', () => {
    const listeners = new Map<string, (event: StorageEvent) => void>()
    const addEventListenerSpy = vi
      .spyOn(window, 'addEventListener')
      .mockImplementation((type, listener) => {
        listeners.set(type, listener as (event: StorageEvent) => void)
      })

    const storage = createSistecStorage({
      appName: 'multi-tab',
      defaults: { theme: 'light' },
      adapter: mockAdapter,
      syncTabs: true,
    })

    const theme = storage.use('theme')
    expect(theme.value).toBe('light')

    mockAdapter.setItem('sistec-localstorage:multi-tab', JSON.stringify({ theme: 'dark' }))
    listeners.get('storage')?.({ key: 'sistec-localstorage:multi-tab' } as StorageEvent)

    expect(theme.value).toBe('dark')
    addEventListenerSpy.mockRestore()
  })
})