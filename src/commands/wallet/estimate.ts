import {Args, Command, Flags} from '@oclif/core'
import {ethers} from 'ethers'
import {existsSync, readFileSync} from 'node:fs'

import {getPresetAbi, PRESET_ABI_NAMES} from '../../lib/default-abis.js'
import {getProvider, getWallet} from '../../lib/provider.js'
import {resolveWalletPrivateKey} from '../../lib/resolve-wallet.js'
import {style, useFancyUi, withSpinner} from '../../lib/ui.js'

export default class WalletEstimate extends Command {
  static args = {
    to: Args.string({
      description: 'Recipient or contract address.',
      required: true,
    }),
    value: Args.string({
      description: 'Value in ETH for native transfer (e.g. 0.1); omit for contract call.',
      required: false,
    }),
  }
  static description =
    'Estimate gas for a native transfer or contract write (same params as send).'
  static examples = [
    `<%= config.bin %> <%= command.id %> 0xRecipient 0.1`,
    `<%= config.bin %> <%= command.id %> 0xContract --method transfer --args 0xTo,1000 --abi erc20`,
    `<%= config.bin %> <%= command.id %> 0xContract --method approve --args 0xSpender,1000 --abi erc20 --json`,
  ]
  static flags = {
    abi: Flags.string({
      description: `ABI preset (${PRESET_ABI_NAMES.join(', ')}) or JSON array for contract call.`,
    }),
    abiFile: Flags.string({
      description: 'Path to JSON file containing ABI array.',
    }),
    args: Flags.string({
      description: 'Comma-separated arguments for contract call.',
    }),
    json: Flags.boolean({
      default: false,
      description: 'Output { gasLimit, gasLimitHex } as JSON.',
    }),
    method: Flags.string({
      description: 'Contract method (omit for native transfer).',
    }),
    wallet: Flags.string({
      char: 'w',
      description: 'Wallet name (from address used for estimate).',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WalletEstimate)
    const provider = getProvider()
    const {privateKey} = resolveWalletPrivateKey(flags.wallet)
    const wallet = getWallet(privateKey, provider)

    const {to} = args
    if (!ethers.isAddress(to)) {
      this.error('Invalid address for "to".')
    }

    // Native transfer
    if (!flags.method) {
      const valueStr = args.value
      if (!valueStr) {
        this.error('For native transfer, provide value in ETH (e.g. 0.1).')
      }

      let value: bigint
      try {
        value = ethers.parseEther(valueStr)
      } catch {
        this.error('Invalid value. Use a number in ETH (e.g. 0.1).')
      }

      const fancy = useFancyUi(flags)
      const gasLimit = await withSpinner(
        'Estimating gas...',
        () =>
          provider.estimateGas({
            from: wallet.address,
            to,
            value,
          }),
        {fancy}
      )

      if (flags.json) {
        this.log(
          JSON.stringify({
            gasLimit: gasLimit.toString(),
            gasLimitHex: '0x' + gasLimit.toString(16),
          })
        )
        return
      }

      this.log(style.label('Gas limit:') + ' ' + style.success(gasLimit.toString()))
      return
    }

    // Contract call
    let abiStr: string | undefined
    if (flags.abiFile) {
      if (!existsSync(flags.abiFile)) this.error(`ABI file not found: ${flags.abiFile}`)
      abiStr = readFileSync(flags.abiFile, 'utf8')
    } else if (flags.abi) {
      abiStr = getPresetAbi(flags.abi) ?? flags.abi
    }

    if (!abiStr) {
      this.error(
        `For contract call provide --abi (preset: ${PRESET_ABI_NAMES.join(', ')}) or --abi-file.`
      )
    }

    let iface: ethers.Interface
    try {
      const abi = JSON.parse(abiStr) as ethers.Fragment[]
      iface = new ethers.Interface(abi)
    } catch {
      this.error('Invalid --abi JSON.')
    }

    const methodName = flags.method
    const fragment = iface.getFunction(methodName)
    if (!fragment) this.error(`Method "${methodName}" not found in ABI.`)

    const inputArgs = flags.args ? flags.args.split(',').map((s) => s.trim()) : []
    const data = iface.encodeFunctionData(methodName, inputArgs)

    const fancy = useFancyUi(flags)
    const gasLimit = await withSpinner(
      'Estimating gas...',
      () =>
        provider.estimateGas({
          data,
          from: wallet.address,
          to,
        }),
      {fancy}
    )

    if (flags.json) {
      this.log(
        JSON.stringify({
          gasLimit: gasLimit.toString(),
          gasLimitHex: '0x' + gasLimit.toString(16),
        })
      )
      return
    }

    this.log(style.label('Gas limit:') + ' ' + style.success(gasLimit.toString()))
  }
}
