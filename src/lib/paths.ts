import {existsSync, mkdirSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const dirName = 'one-wallet'

/**
 * Base config directory (ONE_WALLET_HOME or ~/.one-wallet)
 */
export function getConfigDir(): string {
  const base = process.env.ONE_WALLET_HOME || path.join(os.homedir(), '.one-wallet')
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

/**
 * Path to session file (encrypted passwords with TTL; cleared by wallet lock)
 */
export function getSessionPath(): string {
  return path.join(getConfigDir(), 'session.json')
}

/**
 * Path to session key file (random key used to encrypt passwords in session.json)
 */
export function getSessionKeyPath(): string {
  return path.join(getConfigDir(), 'session.key')
}
