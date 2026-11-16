import type { App, Ref } from 'vue'

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface SistecStorageOptions<T extends Record<string, unknown>> {
  /** Nome da aplicação. Será alocado em `sistec-localstorage:${appName}` */
  appName: string
  /** Chaves obrigatórias da aplicação com seus respectivos valores padrão */
  defaults: T
  /** Adapter customizado (padrão: window.localStorage, com fallback em memória para SSR) */
  adapter?: StorageAdapter
  /** Sincronizar alterações entre abas do navegador (padrão: true) */
  syncTabs?: boolean
}

export interface SistecStorage<T extends Record<string, unknown>> {
  /** Chave completa alocada no storage: `sistec-localstorage:${appName}` */
  readonly storageKey: string
  /** Nome da aplicação configurada */
  readonly appName: string
  /** Lista de chaves permitidas para esta aplicação */
  readonly allowedKeys: ReadonlyArray<keyof T & string>
  /** Lê o valor de uma chave configurada */
  get<K extends keyof T & string>(key: K): T[K]
  /** Salva o valor de uma chave configurada */
  set<K extends keyof T & string>(key: K, value: T[K]): void
  /** Reseta uma chave configurada para o valor padrão */
  remove<K extends keyof T & string>(key: K): void
  /** Reseta todas as chaves da aplicação para os valores padrão */
  clear(): void
  /** Retorna todas as chaves configuradas desta aplicação */
  getAll(): T
  /** Verifica se uma chave pertence à configuração desta aplicação */
  has(key: string): key is keyof T & string
  /** Retorna uma Ref reativa do Vue 3 sincronizada automaticamente com o localStorage */
  use<K extends keyof T & string>(key: K): Ref<T[K]>
  /** Plugin opcional para registrar via app.use(storage) */
  install(app: App): void
}