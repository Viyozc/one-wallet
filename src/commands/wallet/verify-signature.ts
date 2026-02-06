import {Args, Command, Flags} from '@oclif/core'
import {ethers} from 'ethers'

export default class WalletVerifySignature extends Command {
  static args = {
    message: Args.string({
      description: 'Original message (string or 0x-prefixed hex) that was signed.',
      required: true,
    }),
    signature: Args.string({
      description: 'Hex signature (0x-prefixed).',
      required: true,
    }),
  }
  static description =
    'Recover signer address from a message and its EIP-191 signature (verify/recover).'
  static examples = [
    `<%= config.bin %> <%= command.id %> "Hello" 0x...`,
    `<%= config.bin %> <%= command.id %> "Hello" 0x... --expected 0xRecoveredAddress`,
    `<%= config.bin %> <%= command.id %> "Hello" 0x... --json`,
  ]
  static flags = {
    expected: Flags.string({
      description: 'If set, report whether recovered address matches this.',
    }),
    json: Flags.boolean({
      default: false,
      description: 'Output { recovered, match } as JSON.',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WalletVerifySignature)
    const {message} = args
    const messagePayload =
      message.startsWith('0x') && /^0x[0-9a-fA-F]*$/.test(message)
        ? ethers.getBytes(message)
        : message

    let recovered: string
    try {
      recovered = ethers.verifyMessage(messagePayload, args.signature)
    } catch (error) {
      this.error(`Invalid signature or message: ${(error as Error).message}`)
    }

    if (flags.json) {
      const match =
        flags.expected === undefined
          ? undefined
          : ethers.getAddress(recovered) === ethers.getAddress(flags.expected)
      this.log(JSON.stringify({match, recovered}))
      return
    }

    this.log(recovered)
    if (flags.expected !== undefined) {
      const match =
        ethers.getAddress(recovered) === ethers.getAddress(flags.expected)
      this.log(match ? 'Match: yes' : 'Match: no')
    }
  }
}
