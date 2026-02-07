import {existsSync, readFileSync, writeFileSync} from 'node:fs'

import type {CipherPayload} from './crypto.js'

import {getConfigPath, getProviderPath, getWalletsPath} from './paths.js'

export type {CipherPayload} from './crypto.js'

export interface WalletEntry {
  address: string
  /** Encrypted private key when password protection is enabled. */
  cipher?: CipherPayload
  createdAt?: string
  /** Plain private key (hex). Omitted when cipher is set. */
  privateKey?: string
}

/** True if this wallet requires a password to unlock. */
export function isEncryptedWallet(entry: WalletEntry): boolean {
  return Boolean(entry.cipher && !entry.privateKey)
}

export interface WalletsData {
  wallets: Record<string, WalletEntry>
}

export interface GlobalConfig {
  default?: string
}

export interface ProviderState {
  chainId?: number
  /** Preset name when set from provider list (e.g. mainnet). */
  preset?: string
  rpcUrl?: string
}

const defaultWallets: WalletsData = {wallets: {}}
const defaultConfig: GlobalConfig = {}
const defaultProvider: ProviderState = {}

/** Valid hex address (0x + 40 hex chars). */
function isValidAddress(s: unknown): s is string {
  return typeof s === 'string' && /^0x[0-9a-fA-F]{40}$/.test(s)
}

/** Sanitize a single wallet entry to only allowed fields. */
function sanitizeEntry(raw: unknown): null | WalletEntry {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!isValidAddress(o.address)) return null
  const entry: WalletEntry = {
    address: o.address as string,
  }
  if (o.createdAt !== null && typeof o.createdAt === 'string') {
    entry.createdAt = o.createdAt
  }

  const pk = o.privateKey
  if (pk !== null && typeof pk === 'string' && pk.trim().length > 0) {
    entry.privateKey = pk.trim().startsWith('0x') ? pk.trim() : `0x${pk.trim()}`
  }

  const {cipher} = o
  if (
    cipher !== null &&
    typeof cipher === 'object' &&
    typeof (cipher as Record<string, unknown>).ct === 'string' &&
    typeof (cipher as Record<string, unknown>).iv === 'string' &&
    typeof (cipher as Record<string, unknown>).salt === 'string' &&
    typeof (cipher as Record<string, unknown>).tag === 'string'
  ) {
    entry.cipher = cipher as CipherPayload
  }

  return entry
}

export function loadWallets(): WalletsData {
  const p = getWalletsPath()
  if (!existsSync(p)) return {...defaultWallets}
  try {
    const raw = readFileSync(p, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('wallets.json: invalid root (expected object)')
    }

    const {wallets} = (parsed as Record<string, unknown>)
    if (wallets === null || typeof wallets !== 'object') {
      return {...defaultWallets}
    }

    const result: Record<string, WalletEntry> = {}
    for (const [name, value] of Object.entries(wallets)) {
      const entry = sanitizeEntry(value)
      if (entry) result[name] = entry
    }

    return {wallets: result}
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new TypeError(`wallets.json: invalid JSON - ${error.message}`)
    }

    throw error
  }
}

export function saveWallets(data: WalletsData): void {
  writeFileSync(getWalletsPath(), JSON.stringify(data, null, 2), 'utf8')
}

export function loadConfig(): GlobalConfig {
  const p = getConfigPath()
  if (!existsSync(p)) return {...defaultConfig}
  try {
    const raw = readFileSync(p, 'utf8')
    const parsed = {...defaultConfig, ...JSON.parse(raw)} as GlobalConfig & {defaultWallet?: string}
    // Migrate legacy key defaultWallet -> default
    if (parsed.default === undefined && parsed.defaultWallet !== undefined) {
      parsed.default = parsed.defaultWallet
    }

    return parsed as GlobalConfig
  } catch {
    return {...defaultConfig}
  }
}

export function saveConfig(config: GlobalConfig): void {
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8')
}

export function loadProvider(): ProviderState {
  const p = getProviderPath()
  if (!existsSync(p)) return {...defaultProvider}
  try {
    const raw = readFileSync(p, 'utf8')
    return {...defaultProvider, ...JSON.parse(raw)} as ProviderState
  } catch {
    return {...defaultProvider}
  }
}

export function saveProvider(state: ProviderState): void {
  writeFileSync(getProviderPath(), JSON.stringify(state, null, 2), 'utf8')
}
