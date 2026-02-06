import {ethers} from 'ethers'

import {loadProvider} from './store.js'

const defaultRpc = 'https://eth.llamarpc.com'
const defaultChainId = 1

export function getProvider(): ethers.JsonRpcProvider {
  const provider = loadProvider()
  const rpc =
    provider.rpcUrl ||
    process.env.AGENT_WALLET_RPC_URL ||
    defaultRpc
  return new ethers.JsonRpcProvider(rpc)
}

export function getChainId(): number {
  const provider = loadProvider()
  if (provider.chainId !== undefined) return provider.chainId
  const env = process.env.AGENT_WALLET_CHAIN_ID
  if (env !== undefined) {
    const n = Number.parseInt(env, 10)
    if (!Number.isNaN(n)) return n
  }

  return defaultChainId
}

export function getWallet(privateKey: string, provider?: ethers.JsonRpcProvider): ethers.Wallet {
  const p = provider ?? getProvider()
  return new ethers.Wallet(privateKey, p)
}
