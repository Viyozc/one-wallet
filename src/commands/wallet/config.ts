import {Args, Command, Flags} from '@oclif/core'

import {loadConfig, saveConfig} from '../../lib/store.js'

export default class WalletConfig extends Command {
  static args = {
    key: Args.string({
      description: 'Config key: defaultWallet.',
      required: false,
    }),
    value: Args.string({
      description: 'Value to set (omit to get current value).',
      required: false,
    }),
  }
  static description = 'Get or set global config (defaultWallet). Use "provider list" / "provider set" for RPC.'
  static examples = [
    `<%= config.bin %> <%= command.id %>`,
    `<%= config.bin %> <%= command.id %> defaultWallet`,
    `<%= config.bin %> <%= command.id %> defaultWallet my-agent`,
    `<%= config.bin %> <%= command.id %> --json`,
  ]
  static flags = {
    json: Flags.boolean({
      char: 'j',
      default: false,
      description: 'Output config as JSON.',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WalletConfig)
    const config = loadConfig()

    if (!args.key) {
      if (flags.json) {
        this.log(JSON.stringify(config))
        return
      }

      this.log('Current config:')
      this.log(`  defaultWallet: ${config.defaultWallet ?? '(not set)'}`)
      return
    }

    const key = args.key as 'defaultWallet'
    const validKeys = ['defaultWallet']

    if (!validKeys.includes(key)) {
      this.error(`Invalid key. Use: defaultWallet. For RPC use "provider list" / "provider set".`)
    }

    if (args.value === undefined) {
      const v = config[key]
      if (flags.json) {
        this.log(JSON.stringify({[key]: v ?? null}))
        return
      }

      this.log(String(v ?? '(not set)'))
      return
    }

    config[key] = args.value
    saveConfig(config)

    if (flags.json) {
      this.log(JSON.stringify(config))
      return
    }

    this.log(`Set ${key} = ${args.value}`)
  }
}
