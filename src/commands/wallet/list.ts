import {Command, Flags} from '@oclif/core'

import {loadConfig, loadWallets} from '../../lib/store.js'
import {style, useFancyUi} from '../../lib/ui.js'

export default class WalletList extends Command {
  static description = 'List all stored wallets (name and address).'
static examples = [
    `<%= config.bin %> <%= command.id %>`,
    `<%= config.bin %> <%= command.id %> --json`,
  ]
static flags = {
    json: Flags.boolean({
      default: false,
      description: 'Output as JSON for agent parsing.',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WalletList)
    const data = loadWallets()
    const config = loadConfig()
    const names = Object.keys(data.wallets)

    if (flags.json) {
      const list = names.map((name) => ({
        address: data.wallets[name]!.address,
        isDefault: config.defaultWallet === name,
        name,
      }))
      this.log(JSON.stringify({default: config.defaultWallet, wallets: list}))
      return
    }

    if (names.length === 0) {
      this.log(
        style.warning('No wallets.') +
          ' ' +
          style.dim('Create one with: cli-wallet wallet create <name>')
      )
      return
    }

    const fancy = useFancyUi(flags)
    for (const name of names) {
      const w = data.wallets[name]!
      const mark = config.defaultWallet === name ? ' ' + style.info('(default)') : ''
      this.log(
        fancy
          ? style.label(name) + style.dim(': ') + style.value(w.address) + mark
          : `${name}: ${w.address}${config.defaultWallet === name ? ' (default)' : ''}`
      )
    }
  }
}
