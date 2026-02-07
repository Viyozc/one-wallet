import {Command, Flags} from '@oclif/core'

import {clearSession} from '../../lib/session.js'

export default class WalletLock extends Command {
  static description =
    'Clear the session cache so encrypted wallets will prompt for password again.'
  static examples = [
    `<%= config.bin %> <%= command.id %>`,
    `<%= config.bin %> <%= command.id %> --json`,
  ]
  static flags = {
    json: Flags.boolean({
      default: false,
      description: 'Output success as JSON.',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WalletLock)
    clearSession()
    if (flags.json) {
      this.log(JSON.stringify({success: true}))
      return
    }

    this.log('Session cleared. Encrypted wallets will prompt for password on next use.')
  }
}
