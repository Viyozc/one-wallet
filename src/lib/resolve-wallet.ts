import type {WalletEntry} from './store.js'

import {decryptPrivateKey} from './crypto.js'
import {getCachedPassword, setCachedPassword} from './session.js'
import {isEncryptedWallet, loadConfig, loadWallets} from './store.js'
import {promptPassword} from './ui.js'

const ENV_KEY_PREFIX = 'AGENT_WALLET_KEY_'
const ENV_PASSWORD_PREFIX = 'AGENT_WALLET_PASSWORD_'

function envKeyFor(name: string, prefix: string): string {
  return prefix + name.toUpperCase().replaceAll('-', '_')
}

/** In-process cache: private key only in memory, never on disk. */
const memoryPrivateKeyCache = new Map<string, string>()

/**
 * Resolve wallet name to private key. Uses default wallet if name not given.
 * - AGENT_WALLET_KEY_<NAME>: override with raw private key (skip store).
 * - Password-protected: session file stores encrypted password only; memory caches decrypted key for this process.
 */
export async function resolveWalletPrivateKey(
  name?: string
): Promise<{name: string; privateKey: string}> {
  const data = loadWallets()
  const config = loadConfig()
  const walletName = name ?? config.default
  if (!walletName) {
    throw new Error(
      'No wallet specified and no default wallet. Set default: cli-wallet wallet set default <name>'
    )
  }

  const envPrivateKey = process.env[envKeyFor(walletName, ENV_KEY_PREFIX)]
  if (envPrivateKey !== undefined && envPrivateKey !== '') {
    return {name: walletName, privateKey: envPrivateKey}
  }

  const entry = data.wallets[walletName] as undefined | WalletEntry
  if (!entry) {
    throw new Error(`Wallet "${walletName}" not found. List wallets: cli-wallet wallet list`)
  }

  if (entry.privateKey) {
    return {name: walletName, privateKey: entry.privateKey}
  }

  if (!isEncryptedWallet(entry) || !entry.cipher) {
    throw new Error(`Wallet "${walletName}" has no private key or cipher.`)
  }

  const memCached = memoryPrivateKeyCache.get(walletName)
  if (memCached) {
    return {name: walletName, privateKey: memCached}
  }

  const cachedPassword = getCachedPassword(walletName)
  let password: string
  let fromPrompt = false
  if (cachedPassword) {
    password = cachedPassword
  } else {
    const envPass = process.env[envKeyFor(walletName, ENV_PASSWORD_PREFIX)]
    password =
      envPass !== undefined && envPass !== ''
        ? envPass
        : await promptPassword(`Password for wallet "${walletName}":`)
    if (!password) {
      throw new Error(
        'Password required. Set ' +
          envKeyFor(walletName, ENV_PASSWORD_PREFIX) +
          ' or run in TTY to type password.'
      )
    }

    fromPrompt = envPass === undefined || envPass === ''
    if (fromPrompt) setCachedPassword(walletName, password)
  }

  try {
    const privateKey = decryptPrivateKey(password, entry.cipher)
    memoryPrivateKeyCache.set(walletName, privateKey)
    return {name: walletName, privateKey}
  } catch (error) {
    throw new Error(
      'Wrong password or corrupted cipher. ' + ((error as Error).message ?? '')
    )
  }
}
