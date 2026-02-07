import {Command, Flags} from '@oclif/core'
import {ethers} from 'ethers'

import {getWallet} from '../../lib/provider.js'
import {resolveWalletPrivateKey} from '../../lib/resolve-wallet.js'

export default class WalletSignMessage extends Command {
  static description =
    'Sign a message (EIP-191 personal_sign). Output is hex signature.'
  static examples = [
    `<%= config.bin %> <%= command.id %> --message "Hello, agent"`,
    `<%= config.bin %> <%= command.id %> --message "0x48656c6c6f" --wallet my-agent --json`,
  ]
  static flags = {
    json: Flags.boolean({
      default: false,
      description: 'Output { address, signature } as JSON.',
    }),
    message: Flags.string({
      char: 'm',
      description: 'Message to sign (string or 0x-prefixed hex).',
      required: true,
    }),
    wallet: Flags.string({
      char: 'w',
      description: 'Wallet name (uses default if omitted).',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WalletSignMessage)
    const {privateKey} = await resolveWalletPrivateKey(flags.wallet)
    const wallet = getWallet(privateKey)

    const {message} = flags
    const messagePayload =
      message.startsWith('0x') && /^0x[0-9a-fA-F]*$/.test(message)
        ? ethers.getBytes(message)
        : message

    const signature = await wallet.signMessage(messagePayload)

    if (flags.json) {
      this.log(
        JSON.stringify({
          address: wallet.address,
          signature,
        })
      )
      return
    }

    this.log(signature)
  }
}
