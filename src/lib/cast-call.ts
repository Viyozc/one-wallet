import {ethers} from 'ethers'

/**
 * Find the index of the closing ")" that matches the "(" at startIdx (handles nested parens).
 */
function findMatchingClose(trimmed: string, startIdx: number): number {
  let depth = 1
  for (let i = startIdx + 1; i < trimmed.length; i++) {
    if (trimmed[i] === '(') {
      depth++
    } else if (trimmed[i] === ')') {
      depth--
      if (depth === 0) return i
    }
  }

  return -1
}

/**
 * Parse cast-style signature: "functionName(inputTypes)(outputTypes)"
 * Supports nested parens in types (e.g. (address,(uint256,uint256))).
 */
export function parseCastSignature(
  signature: string
): null | {inputs: string; name: string; outputs: string} {
  const trimmed = signature.trim()
  const openParen = trimmed.indexOf('(')
  if (openParen <= 0) return null
  const name = trimmed.slice(0, openParen).trim()
  if (!name) return null

  const inputsClose = findMatchingClose(trimmed, openParen)
  if (inputsClose < 0) return null
  const inputs = trimmed.slice(openParen + 1, inputsClose).trim()

  const rest = trimmed.slice(inputsClose + 1).trimStart()
  if (!rest.startsWith('(')) return {inputs, name, outputs: ''}
  const outputsOpen = inputsClose + 1 + trimmed.slice(inputsClose + 1).indexOf('(')
  const outputsClose = findMatchingClose(trimmed, outputsOpen)
  if (outputsClose < 0) return {inputs, name, outputs: ''}
  const outputs = trimmed.slice(outputsOpen + 1, outputsClose).trim()

  return {inputs, name, outputs}
}

/**
 * Build ethers Fragment from cast-style signature and run eth_call, then decode result.
 */
export function buildFragmentFromCastSignature(signature: string): ethers.FunctionFragment {
  const parsed = parseCastSignature(signature)
  if (!parsed) {
    throw new Error(
      'Invalid cast-style signature. Use "functionName(inputTypes)(outputTypes)" e.g. "balanceOf(address)(uint256)"'
    )
  }

  const {inputs, name, outputs} = parsed
  const returnsPart = outputs ? ` returns (${outputs})` : ''
  const humanReadable = `function ${name}(${inputs}) view${returnsPart}`
  return ethers.Fragment.from(humanReadable) as ethers.FunctionFragment
}

/**
 * Encode calldata, perform eth_call, decode result using cast-style signature.
 */
export async function castStyleCall(
  provider: ethers.Provider,
  to: string,
  signature: string,
  args: string[]
): Promise<ethers.Result> {
  const fragment = buildFragmentFromCastSignature(signature)
  const iface = new ethers.Interface([fragment])
  const calldata = iface.encodeFunctionData(fragment, args)
  const resultHex = await provider.call({
    data: calldata,
    to: ethers.getAddress(to),
  })
  if (!resultHex || resultHex === '0x') {
    return ethers.Result.fromItems([])
  }

  return iface.decodeFunctionResult(fragment, resultHex)
}
