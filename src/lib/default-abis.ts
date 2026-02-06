import {
  erc20Abi,
  erc721Abi,
  erc1155Abi,
  erc4626Abi,
} from 'viem'

/** Preset ABI names: erc20, nft (erc721), erc1155, erc4626 */
export const PRESET_ABI_NAMES = ['erc20', 'nft', 'erc721', 'erc1155', 'erc4626'] as const

const presetMap: Record<string, readonly unknown[]> = {
  erc20: erc20Abi,
  erc721: erc721Abi,
  erc1155: erc1155Abi,
  erc4626: erc4626Abi,
  nft: erc721Abi,
}

/**
 * Get preset ABI as JSON string by name (erc20, nft, erc721, erc1155, erc4626).
 * Returns undefined if name is not a preset.
 */
export function getPresetAbi(name: string): string | undefined {
  const key = name.toLowerCase()
  const abi = presetMap[key]
  if (!abi) return undefined
  return JSON.stringify(abi)
}
