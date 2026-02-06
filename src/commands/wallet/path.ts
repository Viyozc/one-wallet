import {Command, Flags} from '@oclif/core'

import {getConfigDir, getWalletsPath} from '../../lib/paths.js'

export default class WalletPath extends Command {
  static description = 'Print the directory and file path where wallet data is stored.'
  static examples = [
    `<%= config.bin %> <%= command.id %>`,
    `<%= config.bin %> <%= command.id %> --json`,
  ]
  static flags = {
    json: Flags.boolean({
      default: false,
      description: 'Output paths as JSON (dir and walletsFile).',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WalletPath)
    const dir = getConfigDir()
    const walletsFile = getWalletsPath()

    if (flags.json) {
      this.log(JSON.stringify({dir, walletsFile}))
      return
    }

    this.log(dir)
  }
}
