import {Args, Command, Flags} from '@oclif/core'
import {ethers} from 'ethers'
import {existsSync, readFileSync} from 'node:fs'

import {castStyleCall, parseCastSignature} from '../../lib/cast-call.js'
import {getPresetAbi, PRESET_ABI_NAMES} from '../../lib/default-abis.js'
import {getProvider} from '../../lib/provider.js'
import {style, useFancyUi, withSpinner} from '../../lib/ui.js'

export default class WalletCall extends Command {
  static args = {
    contract: Args.string({
      description: 'Contract address.',
      required: true,
    }),
    method: Args.string({
      description:
        'Method name (e.g. balanceOf, decimals) or cast-style signature. Use single quotes for signature: \'decimals()(uint256)\'.',
      required: true,
    }),
    methodArgs: Args.string({
      description: 'Comma-separated arguments for the method (e.g. 0x123, 1).',
      required: false,
    }),
  }
  static description = 'Call a contract view/pure method (read-only, no gas).'
  static examples = [
    `<%= config.bin %> <%= command.id %> <contract> balanceOf 0x... --abi erc20`,
    `<%= config.bin %> <%= command.id %> <contract> 'decimals()(uint256)'`,
    `<%= config.bin %> <%= command.id %> <contract> 'balanceOf(address)(uint256)' 0x...`,
    `<%= config.bin %> <%= command.id %> <contract> totalSupply --abi erc20 --json`,
    `<%= config.bin %> <%= command.id %> <contract> balanceOf 0x...,1 --abi erc1155`,
    `<%= config.bin %> <%= command.id %> <contract> totalSupply --abi-file ./abi.json`,
  ]
  static flags = {
    abi: Flags.string({
      description: `ABI: preset (${PRESET_ABI_NAMES.join(', ')}) or JSON array string.`,
    }),
    abiFile: Flags.string({
      description: 'Path to JSON file containing ABI array.',
    }),
    json: Flags.boolean({
      default: false,
      description: 'Output result as JSON.',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WalletCall)
    const provider = getProvider()
    const inputArgs = args.methodArgs ? args.methodArgs.split(',').map((s) => s.trim()) : []
    const fancy = useFancyUi(flags)

    // Cast-style: method looks like "name(in)(out)" — use single quotes in shell to avoid parens being interpreted
    const castSig = parseCastSignature(args.method)
    if (castSig) {
      let raw: ethers.Result
      try {
        raw = await withSpinner(
          'Calling contract...',
          () => castStyleCall(provider, args.contract, args.method, inputArgs),
          {fancy}
        )
      } catch (error) {
        this.error((error as Error).message)
      }

      const arr = Array.isArray(raw) ? raw : [raw]
      if (flags.json) {
        this.log(JSON.stringify({result: arr.length === 1 ? arr[0] : arr}))
      } else {
        this.log(arr.map((r) => style.value(String(r))).join('\n'))
      }

      return
    }

    // ABI-based call
    let abiStr: string | undefined
    if (flags.abiFile) {
      if (!existsSync(flags.abiFile)) this.error(`ABI file not found: ${flags.abiFile}`)
      abiStr = readFileSync(flags.abiFile, 'utf8')
    } else if (flags.abi) {
      abiStr = getPresetAbi(flags.abi) ?? flags.abi
    }

    if (!abiStr) {
      this.error(
        `Provide --abi (preset: ${PRESET_ABI_NAMES.join(', ')}) or --abi-file, or use cast-style method with single quotes: 'name(in)(out)'.`
      )
    }

    let iface: ethers.Interface
    try {
      const abi = JSON.parse(abiStr) as ethers.Fragment[]
      iface = new ethers.Interface(abi)
    } catch {
      this.error('Invalid --abi JSON. Use a JSON array of ABI fragments.')
    }

    const methodName = args.method
    const fragment = iface.getFunction(methodName)
    if (!fragment) {
      this.error(`Method "${methodName}" not found in ABI.`)
    }

    let result: unknown
    try {
      const contract = new ethers.Contract(args.contract, iface, provider)
      const fn = (contract as ethers.Contract)[methodName]
      if (typeof fn !== 'function') {
        this.error(`Method "${methodName}" is not callable.`)
      }

      result = await withSpinner(
        'Calling contract...',
        () => (fn as (...a: unknown[]) => Promise<unknown>)(...inputArgs),
        {fancy}
      )
    } catch (error) {
      this.error((error as Error).message)
    }

    if (flags.json) {
      const out = Array.isArray(result) ? result : [result]
      this.log(JSON.stringify({result: out.length === 1 ? out[0] : out}))
      return
    }

    if (Array.isArray(result)) {
      this.log(result.map((r) => style.value(String(r))).join('\n'))
    } else {
      this.log(style.success(String(result)))
    }
  }
}
