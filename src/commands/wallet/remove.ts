import {Args, Command, Flags} from '@oclif/core'

import {loadConfig, loadWallets, saveConfig, saveWallets} from '../../lib/store.js'
import {confirm, style, useFancyUi} from '../../lib/ui.js'

export default class WalletRemove extends Command {
  static args = {
    name: Args.string({
      description: 'Wallet name to remove from storage.',
      required: true,
    }),
  }
  static description = 'Remove a wallet from storage (does not delete keys on-chain).'
  static examples = [
    `<%= config.bin %> <%= command.id %> my-agent`,
    `<%= config.bin %> <%= command.id %> my-agent -y`,
    `<%= config.bin %> <%= command.id %> old-wallet --json`,
  ]
  static flags = {
    json: Flags.boolean({
      default: false,
      description: 'Output success as JSON.',
    }),
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt.',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WalletRemove)
    const data = loadWallets()
    const config = loadConfig()
    const {name} = args

    if (!data.wallets[name]) {
      this.error(`Wallet "${name}" not found. List wallets: one-wallet wallet list`)
    }

    const {address} = (data.wallets[name]!)
    const wasDefault = config.default === name

    if (!flags.yes) {
      const ok = await confirm(
        `Remove wallet "${name}" (${address})? This only deletes it from local storage.`,
        false
      )
      if (!ok) {
        this.log('Cancelled.')
        return
      }
    }

    delete data.wallets[name]
    saveWallets(data)

    if (wasDefault) {
      config.default = undefined
      saveConfig(config)
    }

    if (flags.json) {
      this.log(JSON.stringify({name, removed: true, wasDefault}))
      return
    }

    const fancy = useFancyUi(flags)
    if (fancy) {
      this.log(style.success('Removed wallet') + ' ' + style.label(name) + style.dim(` (${address})`))
      if (wasDefault) this.log(style.info('Default wallet cleared. Set a new default with: one-wallet wallet set default <name>'))
    } else {
      this.log(`Removed wallet "${name}" (${address}).`)
      if (wasDefault) this.log('Default wallet cleared.')
    }
  }
}
