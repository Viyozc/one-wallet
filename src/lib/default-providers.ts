import type {Chain} from 'viem'

/**
 * Built-in chain presets from viem/chains (same data as wagmi/chains).
 * Common mainnets and testnets; id and rpcUrls stay in sync with ecosystem.
 */
import {
  anvil,
  arbitrum,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  blast,
  blastSepolia,
  bsc,
  bscTestnet,
  celo,
  celoSepolia,
  cronos,
  cronosTestnet,
  fantom,
  fantomTestnet,
  filecoin,
  filecoinCalibration,
  gnosis,
  gnosisChiado,
  hardhat,
  holesky,
  linea,
  lineaSepolia,
  localhost,
  mainnet,
  mantle,
  mantleTestnet,
  metis,
  metisSepolia,
  mode,
  modeTestnet,
  moonbaseAlpha,
  moonbeam,
  opBNB,
  opBNBTestnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  polygonZkEvm,
  polygonZkEvmCardona,
  scroll,
  scrollSepolia,
  sepolia,
  taiko,
  taikoHoodi,
  zksync,
  zksyncSepoliaTestnet,
  zora,
  zoraSepolia,
} from 'viem/chains'

export interface DefaultProviderEntry {
  chainId: number
  name: string
  rpcUrl: string
}

/** Preset name -> chain (same names as in wagmi/viem). */
const CHAIN_PRESETS: Array<{chain: Chain; name: string}> = [
  // Dev / local
  {chain: localhost, name: 'localhost'},
  {chain: hardhat, name: 'hardhat'},
  {chain: anvil, name: 'anvil'},
  // Ethereum
  {chain: mainnet, name: 'mainnet'},
  {chain: sepolia, name: 'sepolia'},
  {chain: holesky, name: 'holesky'},
  // L2s
  {chain: arbitrum, name: 'arbitrum'},
  {chain: arbitrumSepolia, name: 'arbitrumSepolia'},
  {chain: base, name: 'base'},
  {chain: baseSepolia, name: 'baseSepolia'},
  {chain: optimism, name: 'optimism'},
  {chain: optimismSepolia, name: 'optimismSepolia'},
  {chain: polygon, name: 'polygon'},
  {chain: polygonAmoy, name: 'polygonAmoy'},
  {chain: polygonZkEvm, name: 'polygonZkEvm'},
  {chain: polygonZkEvmCardona, name: 'polygonZkEvmCardona'},
  {chain: blast, name: 'blast'},
  {chain: blastSepolia, name: 'blastSepolia'},
  {chain: linea, name: 'linea'},
  {chain: lineaSepolia, name: 'lineaSepolia'},
  {chain: scroll, name: 'scroll'},
  {chain: scrollSepolia, name: 'scrollSepolia'},
  {chain: zksync, name: 'zksync'},
  {chain: zksyncSepoliaTestnet, name: 'zksyncSepoliaTestnet'},
  {chain: zora, name: 'zora'},
  {chain: zoraSepolia, name: 'zoraSepolia'},
  {chain: mode, name: 'mode'},
  {chain: modeTestnet, name: 'modeTestnet'},
  {chain: taiko, name: 'taiko'},
  {chain: taikoHoodi, name: 'taikoHoodi'},
  {chain: mantle, name: 'mantle'},
  {chain: mantleTestnet, name: 'mantleTestnet'},
  {chain: metis, name: 'metis'},
  {chain: metisSepolia, name: 'metisSepolia'},
  // Other mainnets / testnets
  {chain: bsc, name: 'bsc'},
  {chain: bscTestnet, name: 'bscTestnet'},
  {chain: avalanche, name: 'avalanche'},
  {chain: avalancheFuji, name: 'avalancheFuji'},
  {chain: gnosis, name: 'gnosis'},
  {chain: gnosisChiado, name: 'gnosisChiado'},
  {chain: celo, name: 'celo'},
  {chain: celoSepolia, name: 'celoSepolia'},
  {chain: fantom, name: 'fantom'},
  {chain: fantomTestnet, name: 'fantomTestnet'},
  {chain: filecoin, name: 'filecoin'},
  {chain: filecoinCalibration, name: 'filecoinCalibration'},
  {chain: moonbeam, name: 'moonbeam'},
  {chain: moonbaseAlpha, name: 'moonbaseAlpha'},
  {chain: cronos, name: 'cronos'},
  {chain: cronosTestnet, name: 'cronosTestnet'},
  {chain: opBNB, name: 'opBNB'},
  {chain: opBNBTestnet, name: 'opBNBTestnet'},
]

function chainToEntry(name: string, chain: Chain): DefaultProviderEntry {
  const http = chain.rpcUrls?.default?.http
  const rpcUrl = Array.isArray(http) && http[0] ? http[0] : ''
  return {chainId: chain.id, name, rpcUrl}
}

export const DEFAULT_PROVIDERS: DefaultProviderEntry[] = CHAIN_PRESETS.map(
  ({chain, name}) => chainToEntry(name, chain),
)

export function getDefaultProviderByName(name: string): DefaultProviderEntry | undefined {
  const lower = name.toLowerCase()
  return DEFAULT_PROVIDERS.find((p) => p.name.toLowerCase() === lower)
}
