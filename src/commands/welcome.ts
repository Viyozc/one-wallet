import {Command, Flags} from '@oclif/core'

import {renderBanner, style} from '../lib/ui.js'

export default class Welcome extends Command {
  static description = 'Show welcome banner and short intro.'
  static examples = [`<%= config.bin %> <%= command.id %>`]
  static flags = {
    json: Flags.boolean({
      default: false,
      description: 'Skip banner; output minimal JSON.',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Welcome)
    if (flags.json) {
      this.log(JSON.stringify({name: 'one-wallet', welcome: true}))
      return
    }

    const banner = await renderBanner('one-wallet')
    this.log(style.info(banner))
    this.log('')
    this.log(style.dim('  CLI wallet for agents: balance, send, sign, call contracts.'))
    this.log(style.dim('  Use --help on any command. Example: wallet balance'))
    this.log('')
  }
}
