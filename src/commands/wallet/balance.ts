import {Args, Command, Flags} from '@oclif/core'
import {ethers} from 'ethers'

import {getProvider} from '../../lib/provider.js'
import {resolveWalletPrivateKey} from '../../lib/resolve-wallet.js'
import {style, useFancyUi, withSpinner} from '../../lib/ui.js'

export default class WalletBalance extends Command {
  static args = {
    wallet: Args.string({
      description: 'Wallet name (uses default if omitted).',
      required: false,
    }),
  }
static description = 'Get native (ETH) balance of a wallet.'
static examples = [
    `<%= config.bin %> <%= command.id %>`,
    `<%= config.bin %> <%= command.id %> my-agent`,
    `<%= config.bin %> <%= command.id %> --json`,
  ]
static flags = {
    json: Flags.boolean({
      default: false,
      description: 'Output as JSON (wei and ether).',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WalletBalance)
    const {name, privateKey} = await resolveWalletPrivateKey(args.wallet)
    const provider = getProvider()
    const wallet = new ethers.Wallet(privateKey, provider)
    const fancy = useFancyUi(flags)

    const balance = await withSpinner(
      'Fetching balance...',
      () => provider.getBalance(wallet.address),
      {fancy}
    )

    if (flags.json) {
      this.log(
        JSON.stringify({
          address: wallet.address,
          ether: ethers.formatEther(balance),
          wallet: name,
          wei: balance.toString(),
        })
      )
      return
    }

    this.log(
      `${style.label(name)} ${style.dim(`(${wallet.address}):`)} ${style.success(ethers.formatEther(balance) + ' ETH')}`
    )
  }
}
