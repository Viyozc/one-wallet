import {Args, Command, Flags} from '@oclif/core'
import {ethers} from 'ethers'
import {existsSync, readFileSync} from 'node:fs'

import {getPresetAbi, PRESET_ABI_NAMES} from '../../lib/default-abis.js'
import {getProvider, getWallet} from '../../lib/provider.js'
import {resolveWalletPrivateKey} from '../../lib/resolve-wallet.js'
import {confirm, style, useFancyUi, withSpinner} from '../../lib/ui.js'

export default class WalletSend extends Command {
  static args = {
    to: Args.string({
      description: 'Recipient address or contract address (for contract call).',
      required: true,
    }),
    amount: Args.string({
      description: 'Amount in ETH (e.g. 0.1) for native transfer; omit for contract call.',
      required: false,
    }),
  }
static description =
    'Send native ETH to an address, or call a contract write method.'
static examples = [
    `<%= config.bin %> <%= command.id %> 0xRecipient 0.1`,
    `<%= config.bin %> <%= command.id %> 0xRecipient 0.1 --wallet my-agent --json`,
    `<%= config.bin %> <%= command.id %> 0xContract --method transfer --args 0xTo,1000000 --abi erc20`,
    `<%= config.bin %> <%= command.id %> 0xContract --method approve --args 0xSpender,1000000 --abi erc20`,
    `<%= config.bin %> <%= command.id %> 0xContract --method safeTransferFrom --args 0xFrom,0xTo,1 --abi nft`,
    `<%= config.bin %> <%= command.id %> 0xContract --method transfer --args 0xTo,1000000 --abi-file ./erc20.json`,
  ]
static flags = {
    abi: Flags.string({
      description: `ABI: preset (${PRESET_ABI_NAMES.join(', ')}) or JSON array string for contract call.`,
    }),
    abiFile: Flags.string({
      description: 'Path to JSON file containing ABI array.',
    }),
    args: Flags.string({
      description: 'Comma-separated arguments for contract call.',
    }),
    gasLimit: Flags.integer({
      description: 'Gas limit for the transaction.',
    }),
    json: Flags.boolean({
      default: false,
      description: 'Output tx hash and receipt as JSON.',
    }),
    method: Flags.string({
      description: 'Contract method to call (for contract write; omit for native transfer).',
    }),
    wallet: Flags.string({
      char: 'w',
      description: 'Wallet name (uses default if omitted).',
    }),
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt (non-interactive).',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WalletSend)
    const {privateKey} = await resolveWalletPrivateKey(flags.wallet)
    const provider = getProvider()
    const wallet = getWallet(privateKey, provider)

    const {to} = args
    if (!ethers.isAddress(to)) {
      this.error('Invalid address for "to".')
    }

    // Native transfer
    if (!flags.method) {
      const amountStr = args.amount
      if (!amountStr) {
        this.error('For native transfer, provide amount in ETH (e.g. 0.1).')
      }

      let value: bigint
      try {
        value = ethers.parseEther(amountStr)
      } catch {
        this.error('Invalid amount. Use a number in ETH (e.g. 0.1).')
      }

      const fancy = useFancyUi(flags)
      if (fancy && !flags.yes && !flags.json) {
        const ok = await confirm(
          `Send ${style.value(amountStr)} ETH to ${style.label(to)}?`
        )
        if (!ok) this.exit(0)
      }

      const tx = await withSpinner(
        'Sending transaction...',
        () => wallet.sendTransaction({to, value}),
        {fancy}
      )
      if (flags.json) {
        const receipt = await tx.wait()
        this.log(
          JSON.stringify({
            blockNumber: receipt?.blockNumber,
            from: tx.from,
            hash: tx.hash,
            status: receipt?.status,
            to: tx.to,
            value: value.toString(),
          })
        )
        return
      }

      const receipt = await withSpinner('Waiting for receipt...', () => tx.wait(), {
        fancy,
      })
      this.log(
        style.success(`Sent ${amountStr} ETH to ${to}.`) +
          ' ' +
          style.dim(`Tx: ${style.txHash(tx.hash)}`) +
          (receipt?.status === 1 ? ' ' + style.success('✓') : '')
      )
      return
    }

    // Contract write
    let abiStr: string | undefined
    if (flags.abiFile) {
      if (!existsSync(flags.abiFile)) {
        this.error(`ABI file not found: ${flags.abiFile}`)
      }

      abiStr = readFileSync(flags.abiFile, 'utf8')
    } else if (flags.abi) {
      abiStr = getPresetAbi(flags.abi) ?? flags.abi
    }

    if (!abiStr) {
      this.error(
        `For contract call, provide --abi (preset: ${PRESET_ABI_NAMES.join(', ')}) or --abi-file.`
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
    if (!fragment) {
      this.error(`Method "${methodName}" not found in ABI.`)
    }

    const inputArgs = flags.args ? flags.args.split(',').map((s) => s.trim()) : []
    const contract = new ethers.Contract(to, iface, wallet)
    const fn = (contract as ethers.Contract)[methodName]
    if (typeof fn !== 'function') {
      this.error(`Method "${methodName}" is not callable.`)
    }

    const fancy = useFancyUi(flags)
    if (fancy && !flags.yes && !flags.json) {
      const ok = await confirm(
        `Call ${style.label(methodName)} on ${style.label(to)}?`
      )
      if (!ok) this.exit(0)
    }

    const txRequest: {gasLimit?: number} = {}
    if (flags.gasLimit) txRequest.gasLimit = flags.gasLimit

    const tx = await withSpinner(
      'Sending transaction...',
      () =>
        (fn as (...a: unknown[]) => Promise<ethers.TransactionResponse>)(
          ...inputArgs,
          txRequest
        ).catch((error: Error) => {
          this.error(error.message)
        }),
      {fancy}
    )

    if (flags.json) {
      const receipt = await tx.wait()
      this.log(
        JSON.stringify({
          blockNumber: receipt?.blockNumber,
          from: tx.from,
          hash: tx.hash,
          status: receipt?.status,
          to: tx.to,
        })
      )
      return
    }

    const receipt = await withSpinner('Waiting for receipt...', () => tx.wait(), {
      fancy,
    })
    this.log(
      style.success('Transaction sent.') +
        ' ' +
        style.dim(`Tx: ${style.txHash(tx.hash)}`) +
        (receipt?.status === 1 ? ' ' + style.success('✓') : '')
    )
  }
}
