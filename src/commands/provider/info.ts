import {Command, Flags} from '@oclif/core'

import {getChainId} from '../../lib/provider.js'
import {loadProvider} from '../../lib/store.js'
import {style, useFancyUi} from '../../lib/ui.js'

const defaultRpc = 'https://eth.llamarpc.com'

export default class ProviderInfo extends Command {
  static description = 'Show current provider configuration (saved + env overrides).'
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
    const {flags} = await this.parse(ProviderInfo)
    const saved = loadProvider()
    const rpcUrl =
      saved.rpcUrl ??
      process.env.ONE_WALLET_RPC_URL ??
      defaultRpc
    const chainId = getChainId()
    const rpcFromEnv = process.env.ONE_WALLET_RPC_URL != null
    const chainIdFromEnv = process.env.ONE_WALLET_CHAIN_ID != null

    if (flags.json) {
      this.log(
        JSON.stringify({
          chainId,
          preset: saved.preset ?? null,
          rpcUrl,
          source: {
            chainId: chainIdFromEnv ? 'env' : saved.chainId !== undefined ? 'saved' : 'default',
            rpcUrl: rpcFromEnv ? 'env' : saved.rpcUrl ? 'saved' : 'default',
          },
        })
      )
      return
    }

    const fancy = useFancyUi(flags)
    if (fancy) {
      this.log(style.label('Provider'))
      this.log(style.dim('  rpcUrl:  ') + style.value(rpcUrl))
      this.log(style.dim('  chainId: ') + style.value(String(chainId)))
      if (saved.preset) this.log(style.dim('  preset:  ') + style.value(saved.preset))
      if (rpcFromEnv || chainIdFromEnv) {
        const overrides = [rpcFromEnv && 'ONE_WALLET_RPC_URL', chainIdFromEnv && 'ONE_WALLET_CHAIN_ID'].filter(Boolean).join(', ')
        this.log('')
        this.log(style.dim('  overrides: ') + style.info(overrides))
      }
    } else {
      this.log('rpcUrl:  ' + rpcUrl)
      this.log('chainId: ' + chainId)
      if (saved.preset) this.log('preset:  ' + saved.preset)
      if (rpcFromEnv || chainIdFromEnv) {
        this.log('(env overrides: ' + [rpcFromEnv && 'ONE_WALLET_RPC_URL', chainIdFromEnv && 'ONE_WALLET_CHAIN_ID'].filter(Boolean).join(', ') + ')')
      }
    }
  }
}
