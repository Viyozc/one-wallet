import {Args, Command, Flags} from '@oclif/core'

import {CorruptedCipherError, decryptPrivateKey, encryptPrivateKey, WrongPasswordError} from '../../lib/crypto.js'
import {isEncryptedWallet, loadWallets, saveWallets} from '../../lib/store.js'
import {promptPassword, readPasswordFromStdin} from '../../lib/ui.js'

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
    passwordStdin: Flags.boolean({
      default: false,
      description: 'Read password(s) from stdin (current, new, confirm — one per line). Non-TTY only.',
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

    const isEncrypted = isEncryptedWallet(entry) && entry.cipher
    let currentPassword: string | undefined
    let newPassword: string
    let confirmPassword: string

    if (flags.passwordStdin) {
      const lines = await readPasswordFromStdin(isEncrypted ? 3 : 2)
      if (isEncrypted) {
        currentPassword = lines[0]
        newPassword = lines[1]
        confirmPassword = lines[2]
      } else {
        newPassword = lines[0]
        confirmPassword = lines[1]
      }
    } else {
      if (isEncrypted) {
        currentPassword = await promptPassword(`Current password for "${name}":`)
        if (!currentPassword?.trim()) this.error('Password is required.')
      }

      newPassword = (await promptPassword('New password:')) ?? ''
      confirmPassword = (await promptPassword('Confirm new password:')) ?? ''
    }

    if (!newPassword.trim()) this.error('New password cannot be empty.')
    if (newPassword !== confirmPassword) this.error('Passwords do not match.')

    let privateKeyHex: string
    if (isEncrypted && entry.cipher) {
      if (!currentPassword?.trim()) this.error('Current password is required.')
      try {
        privateKeyHex = decryptPrivateKey(currentPassword!, entry.cipher)
      } catch (error) {
        if (error instanceof WrongPasswordError) this.error('Wrong current password.')
        if (error instanceof CorruptedCipherError) this.error('Corrupted cipher. ' + error.message)
        throw error
      }
    } else if (entry.privateKey) {
      privateKeyHex = entry.privateKey
    } else {
      this.error(`Wallet "${name}" has no key or cipher.`)
    }

    const cipher = encryptPrivateKey(newPassword, privateKeyHex)
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
