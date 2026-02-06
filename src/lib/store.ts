import {existsSync, readFileSync, writeFileSync} from 'node:fs'

import {getConfigPath, getProviderPath, getWalletsPath} from './paths.js'

export interface WalletEntry {
  address: string
  createdAt?: string
  /** Encrypted or plain private key; for agent dev, often plain. */
  privateKey: string
}

export interface WalletsData {
  wallets: Record<string, WalletEntry>
}

export interface GlobalConfig {
  defaultWallet?: string
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

export function loadWallets(): WalletsData {
  const p = getWalletsPath()
  if (!existsSync(p)) return {...defaultWallets}
  try {
    const raw = readFileSync(p, 'utf8')
    return {...defaultWallets, ...JSON.parse(raw)} as WalletsData
  } catch {
    return {...defaultWallets}
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
    return {...defaultConfig, ...JSON.parse(raw)} as GlobalConfig
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
