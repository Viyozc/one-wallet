import {Args, Command, Flags} from '@oclif/core'

import {CorruptedCipherError, decryptPrivateKey, WrongPasswordError} from '../../lib/crypto.js'
import {isEncryptedWallet, loadWallets, saveWallets} from '../../lib/store.js'
import {promptPassword, readPasswordFromStdin} from '../../lib/ui.js'

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
    passwordStdin: Flags.boolean({
      default: false,
      description: 'Read password from stdin (one line). Non-TTY only.',
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

    const password = flags.passwordStdin
      ? (await readPasswordFromStdin(1))[0]
      : await promptPassword(`Password for "${name}":`)
    if (!password?.trim()) this.error('Password is required.')
    let privateKey: string
    try {
      privateKey = decryptPrivateKey(password, entry.cipher)
    } catch (error) {
      if (error instanceof WrongPasswordError) this.error('Wrong password.')
      if (error instanceof CorruptedCipherError) this.error('Corrupted cipher. ' + error.message)
      throw error
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
