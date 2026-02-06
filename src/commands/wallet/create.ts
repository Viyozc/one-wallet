import {Args, Command, Flags} from '@oclif/core'
import {ethers} from 'ethers'

import {loadConfig, loadWallets, saveConfig, saveWallets} from '../../lib/store.js'
import {style, useFancyUi} from '../../lib/ui.js'

export default class WalletCreate extends Command {
  static args = {
    name: Args.string({
      description: 'Wallet alias name to create.',
      required: true,
    }),
  }
static description = 'Create a new wallet (or import from private key).'
static examples = [
    `<%= config.bin %> <%= command.id %> my-agent`,
    `<%= config.bin %> <%= command.id %> my-agent --import <private-key>`,
    `<%= config.bin %> <%= command.id %> my-agent --set-default --json`,
  ]
static flags = {
    import: Flags.string({
      char: 'i',
      description: 'Import existing wallet by private key (hex with or without 0x).',
    }),
    json: Flags.boolean({
      default: false,
      description: 'Output address and name as JSON.',
    }),
    setDefault: Flags.boolean({
      default: false,
      description: 'Set this wallet as the default.',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WalletCreate)
    const data = loadWallets()
    const {name} = args

    if (data.wallets[name]) {
      this.error(`Wallet "${name}" already exists. Use another name or remove it first.`)
    }

    let wallet: ethers.HDNodeWallet | ethers.Wallet
    if (flags.import) {
      const key = flags.import.startsWith('0x') ? flags.import : `0x${flags.import}`
      try {
        wallet = new ethers.Wallet(key)
      } catch (error) {
        this.error(`Invalid private key: ${(error as Error).message}`)
      }
    } else {
      wallet = ethers.Wallet.createRandom()
    }

    const entry = {
      address: wallet.address,
      createdAt: new Date().toISOString(),
      privateKey: wallet.privateKey,
    }
    data.wallets[name] = entry
    saveWallets(data)

    if (flags.setDefault) {
      const config = loadConfig()
      config.defaultWallet = name
      saveConfig(config)
    }

    if (flags.json) {
      this.log(
        JSON.stringify({
          address: wallet.address,
          name,
          setDefault: flags.setDefault,
        })
      )
      return
    }

    const fancy = useFancyUi(flags)
    if (fancy) {
      this.log(
        style.success('Created wallet') +
          ' ' +
          style.label(name) +
          style.dim(': ') +
          style.value(wallet.address)
      )
      if (flags.import) this.log(style.dim('(imported from private key)'))
      if (flags.setDefault) this.log(style.info('Set as default wallet.'))
    } else {
      this.log(`Created wallet "${name}": ${wallet.address}`)
      if (flags.import) this.log('(imported from private key)')
      if (flags.setDefault) this.log('Set as default wallet.')
    }
  }
}
