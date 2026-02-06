import {loadConfig, loadWallets} from './store.js'

/**
 * Resolve wallet name to private key. Uses default wallet if name not given.
 */
export function resolveWalletPrivateKey(name?: string): {name: string; privateKey: string} {
  const data = loadWallets()
  const config = loadConfig()
  const walletName = name ?? config.defaultWallet
  if (!walletName) {
    throw new Error(
      'No wallet specified and no default wallet. Set default: agent-wallet wallet config defaultWallet <name>',
    )
  }

  const entry = data.wallets[walletName]
  if (!entry) {
    throw new Error(`Wallet "${walletName}" not found. List wallets: agent-wallet wallet list`)
  }

  const pk = process.env[`AGENT_WALLET_KEY_${walletName.toUpperCase().replaceAll('-', '_')}`] ?? entry.privateKey
  return {name: walletName, privateKey: pk}
}
