import {Args, Command, Flags} from '@oclif/core'
import {ethers} from 'ethers'
import {existsSync, readFileSync} from 'node:fs'

import {getPresetAbi, PRESET_ABI_NAMES} from '../../lib/default-abis.js'
import {getProvider} from '../../lib/provider.js'
import {style, useFancyUi, withSpinner} from '../../lib/ui.js'

export default class WalletCall extends Command {
  static args = {
    args: Args.string({
      description: 'Comma-separated arguments (e.g. 0x123, 1).',
      required: false,
    }),
    contract: Args.string({
      description: 'Contract address.',
      required: true,
    }),
    method: Args.string({
      description: 'Contract method name (e.g. balanceOf, totalSupply).',
      required: true,
    }),
  }
static description = 'Call a contract view/pure method (read-only, no gas).'
static examples = [
    `<%= config.bin %> <%= command.id %> <contract> balanceOf 0x... --abi erc20`,
    `<%= config.bin %> <%= command.id %> <contract> totalSupply --abi erc20 --json`,
    `<%= config.bin %> <%= command.id %> <contract> symbol --abi erc20`,
    `<%= config.bin %> <%= command.id %> <contract> balanceOf 0x... --abi nft`,
    `<%= config.bin %> <%= command.id %> <contract> ownerOf 1 --abi erc721`,
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

    let abiStr: string | undefined
    if (flags.abiFile) {
      if (!existsSync(flags.abiFile)) this.error(`ABI file not found: ${flags.abiFile}`)
      abiStr = readFileSync(flags.abiFile, 'utf8')
    } else if (flags.abi) {
      abiStr = getPresetAbi(flags.abi) ?? flags.abi
    }

    if (!abiStr) {
      this.error(
        `Provide --abi (preset: ${PRESET_ABI_NAMES.join(', ')}) or --abi-file so the call can be encoded correctly.`
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

    const inputArgs = args.args
      ? args.args.split(',').map((s) => s.trim())
      : []

    const fancy = useFancyUi(flags)
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
