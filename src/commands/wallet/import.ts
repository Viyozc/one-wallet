import {Args, Command, Flags} from '@oclif/core'
import {ethers} from 'ethers'
import * as readline from 'node:readline'

import {loadConfig, loadWallets, saveConfig, saveWallets} from '../../lib/store.js'

export default class WalletImport extends Command {
  static args = {
    name: Args.string({
      description: 'Wallet alias name to create from imported key.',
      required: true,
    }),
  }
  static description =
    'Import a wallet from private key (--private-key or stdin for security).'
  static examples = [
    `<%= config.bin %> <%= command.id %> my-agent --private-key 0x...`,
    `echo $PRIVATE_KEY | <%= config.bin %> <%= command.id %> my-agent`,
    `<%= config.bin %> <%= command.id %> my-agent --private-key 0x... --set-default --json`,
  ]
  static flags = {
    json: Flags.boolean({
      default: false,
      description: 'Output address and name as JSON.',
    }),
    privateKey: Flags.string({
      char: 'k',
      description: 'Private key (hex with or without 0x). Omit to read from stdin.',
    }),
    setDefault: Flags.boolean({
      default: false,
      description: 'Set this wallet as the default.',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WalletImport)
    const data = loadWallets()
    const {name} = args

    if (data.wallets[name]) {
      this.error(`Wallet "${name}" already exists. Use another name or remove it first.`)
    }

    let rawKey: string
    if (flags.privateKey) {
      rawKey = flags.privateKey.trim()
    } else {
      rawKey = await this.readStdinLine()
      if (!rawKey) {
        this.error('No private key provided. Use --private-key or pipe key via stdin.')
      }
    }

    const key = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`
    let wallet: ethers.Wallet
    try {
      wallet = new ethers.Wallet(key)
    } catch (error) {
      this.error(`Invalid private key: ${(error as Error).message}`)
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
      config.default = name
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

    this.log(`Imported wallet "${name}": ${wallet.address}`)
    if (flags.setDefault) this.log('Set as default wallet.')
  }

  private readStdinLine(): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({input: process.stdin})
      rl.once('line', (line) => {
        rl.close()
        resolve(line.trim())
      })
      rl.once('close', () => resolve(''))
    })
  }
}
