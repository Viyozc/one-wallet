import {existsSync, mkdirSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const dirName = 'one-wallet'

/**
 * Base config directory (AGENT_WALLET_HOME or ~/.one-wallet)
 */
export function getConfigDir(): string {
  const base = process.env.AGENT_WALLET_HOME || path.join(os.homedir(), '.one-wallet')
  const dir = path.join(base, dirName)
  if (!existsSync(dir)) {
    mkdirSync(dir, {recursive: true})
  }

  return dir
}

/**
 * Path to wallets JSON file
 */
export function getWalletsPath(): string {
  return path.join(getConfigDir(), 'wallets.json')
}

/**
 * Path to config JSON file
 */
export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json')
}

/**
 * Path to provider JSON file (current rpcUrl + chainId)
 */
export function getProviderPath(): string {
  return path.join(getConfigDir(), 'provider.json')
}
