import {Command, Flags} from '@oclif/core'

import {DEFAULT_PROVIDERS} from '../../lib/default-providers.js'
import {loadProvider} from '../../lib/store.js'

export default class ProviderList extends Command {
  static description = 'List built-in chain providers and show current provider.'
  static examples = [
    `<%= config.bin %> <%= command.id %>`,
    `<%= config.bin %> <%= command.id %> --json`,
  ]
  static flags = {
    json: Flags.boolean({
      default: false,
      description: 'Output as JSON.',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ProviderList)
    const current = loadProvider()

    if (flags.json) {
      this.log(
        JSON.stringify({
          current: {
            chainId: current.chainId ?? null,
            preset: current.preset ?? null,
            rpcUrl: current.rpcUrl ?? null,
          },
          presets: DEFAULT_PROVIDERS,
        }),
      )
      return
    }

    this.log('Current provider:')
    if (current.rpcUrl ?? current.chainId !== undefined) {
      this.log(`  rpcUrl:  ${current.rpcUrl ?? '(not set)'}`)
      this.log(`  chainId: ${current.chainId ?? '(not set)'}`)
      if (current.preset) this.log(`  preset:  ${current.preset}`)
    } else {
      this.log('  (not set; using default mainnet)')
    }

    this.log('')
    this.log('Built-in presets (use: provider set <name>):')
    for (const p of DEFAULT_PROVIDERS) {
      const mark = current.preset === p.name ? ' *' : ''
      this.log(`  ${p.name.padEnd(12)} chainId=${String(p.chainId).padEnd(6)} ${p.rpcUrl}${mark}`)
    }
  }
}
