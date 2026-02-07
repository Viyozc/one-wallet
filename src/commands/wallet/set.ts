import {Args, Command, Flags} from '@oclif/core'

import {loadConfig, saveConfig} from '../../lib/store.js'

export default class WalletSet extends Command {
  static args = {
    key: Args.string({
      description: 'Key: default (default wallet name).',
      required: false,
    }),
    value: Args.string({
      description: 'Value to set (omit to get current value).',
      required: false,
    }),
  }
  static description =
    'Get or set global config. Use "default" to get/set default wallet.'
  static examples = [
    `<%= config.bin %> <%= command.id %>`,
    `<%= config.bin %> <%= command.id %> default`,
    `<%= config.bin %> <%= command.id %> default my-agent`,
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
    const {args, flags} = await this.parse(WalletSet)
    const config = loadConfig()

    if (!args.key) {
      if (flags.json) {
        this.log(JSON.stringify(config))
        return
      }

      this.log('Current config:')
      this.log(`  default: ${config.default ?? '(not set)'}`)
      return
    }

    const key = args.key as 'default'
    const validKeys = ['default']

    if (!validKeys.includes(key)) {
      this.error(
        `Invalid key. Use: default. For RPC use "provider list" / "provider set".`
      )
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
