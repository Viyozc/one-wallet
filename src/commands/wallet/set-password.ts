import {Args, Command, Flags} from '@oclif/core'

import {decryptPrivateKey, encryptPrivateKey} from '../../lib/crypto.js'
import {isEncryptedWallet, loadWallets,saveWallets} from '../../lib/store.js'
import {promptPassword} from '../../lib/ui.js'

export default class WalletSetPassword extends Command {
  static args = {
    name: Args.string({
      description: 'Wallet name to set or change password for.',
      required: true,
    }),
  }
  static description =
    'Encrypt a wallet with a password, or change the password of an encrypted wallet.'
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
    const {args, flags} = await this.parse(WalletSetPassword)
    const data = loadWallets()
    const {name} = args
    const entry = data.wallets[name]
    if (!entry) {
      this.error(`Wallet "${name}" not found.`)
    }

    let privateKeyHex: string
    if (isEncryptedWallet(entry) && entry.cipher) {
      const current = await promptPassword(`Current password for "${name}":`)
      if (!current) this.error('Password is required.')
      try {
        privateKeyHex = decryptPrivateKey(current, entry.cipher)
      } catch {
        this.error('Wrong current password.')
      }
    } else if (entry.privateKey) {
      privateKeyHex = entry.privateKey
    } else {
      this.error(`Wallet "${name}" has no key or cipher.`)
    }

    const password =
      (await promptPassword('New password:')) || this.error('New password cannot be empty.')
    const again = await promptPassword('Confirm new password:')
    if (password !== again) this.error('Passwords do not match.')

    const cipher = encryptPrivateKey(password, privateKeyHex)
    data.wallets[name] = {
      address: entry.address,
      cipher,
      createdAt: entry.createdAt,
    }
    saveWallets(data)

    if (flags.json) {
      this.log(JSON.stringify({name, success: true}))
      return
    }

    this.log(`Password set for wallet "${name}".`)
  }
}
