import type { InjectionKey } from 'vue'
import type { SistecStorage } from './types'

export const SISTEC_STORAGE_PREFIX = 'sistec-localstorage:'

export const SISTEC_STORAGE_INJECTION_KEY: InjectionKey<
  SistecStorage<Record<string, unknown>>
> = Symbol('sistec-localstorage')