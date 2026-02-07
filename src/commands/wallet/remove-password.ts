import {Args, Command, Flags} from '@oclif/core'

import {decryptPrivateKey} from '../../lib/crypto.js'
import {isEncryptedWallet, loadWallets,saveWallets} from '../../lib/store.js'
import {promptPassword} from '../../lib/ui.js'

export default class WalletRemovePassword extends Command {
  static args = {
    name: Args.string({
      description: 'Wallet name to remove password from (store private key in plain).',
      required: true,
    }),
  }
  static description =
    'Remove password protection from a wallet; private key will be stored in plain text.'
  static examples = [
    `<%= config.bin %> <%= command.id %> my-agent`,
    `<%= config.bin %> <%= command.id %> my-agent --json`,
  ]
  static flags = {
    json: Flags.boolean({
      default: false,
      description: 'Output success as JSON.',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WalletRemovePassword)
    const data = loadWallets()
    const {name} = args
    const entry = data.wallets[name]
    if (!entry) {
      this.error(`Wallet "${name}" not found.`)
    }

    if (!isEncryptedWallet(entry) || !entry.cipher) {
      this.error(`Wallet "${name}" is not password-protected.`)
    }

    const password = await promptPassword(`Password for "${name}":`)
    if (!password) this.error('Password is required.')
    let privateKey: string
    try {
      privateKey = decryptPrivateKey(password, entry.cipher)
    } catch {
      this.error('Wrong password.')
    }

    data.wallets[name] = {
      address: entry.address,
      createdAt: entry.createdAt,
      privateKey,
    }
    saveWallets(data)

    if (flags.json) {
      this.log(JSON.stringify({name, success: true}))
      return
    }

    this.log(`Password removed for wallet "${name}". Private key is now stored in plain text.`)
  }
}
