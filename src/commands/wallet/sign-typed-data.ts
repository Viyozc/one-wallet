import {Command, Flags} from '@oclif/core'
import {ethers} from 'ethers'
import {existsSync, readFileSync} from 'node:fs'

import {getWallet} from '../../lib/provider.js'
import {resolveWalletPrivateKey} from '../../lib/resolve-wallet.js'

/** EIP-712 payload: domain, types, primaryType, message. */
interface TypedDataPayload {
  domain: ethers.TypedDataDomain
  message: Record<string, unknown>
  primaryType: string
  types: Record<string, ethers.TypedDataField[]>
}

export default class WalletSignTypedData extends Command {
  static description =
    'Sign EIP-712 typed data. Payload JSON: { domain, types, primaryType, message }.'
  static examples = [
    `<%= config.bin %> <%= command.id %> --file payload.json`,
    `<%= config.bin %> <%= command.id %> --payload '{"domain":{"name":"Test","chainId":1},"types":{"Mail":[{"name":"from","type":"address"},{"name":"contents","type":"string"}]},"primaryType":"Mail","message":{"from":"0x...","contents":"Hello"}}' --wallet my-agent --json`,
  ]
  static flags = {
    file: Flags.string({
      char: 'f',
      description: 'Path to JSON file with EIP-712 payload (domain, types, primaryType, message).',
    }),
    json: Flags.boolean({
      default: false,
      description: 'Output { address, signature } as JSON.',
    }),
    payload: Flags.string({
      description: 'Inline JSON string of EIP-712 payload.',
    }),
    wallet: Flags.string({
      char: 'w',
      description: 'Wallet name (uses default if omitted).',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WalletSignTypedData)
    const {privateKey} = resolveWalletPrivateKey(flags.wallet)
    const wallet = getWallet(privateKey)

    let raw: string
    if (flags.file) {
      if (!existsSync(flags.file)) this.error(`File not found: ${flags.file}`)
      raw = readFileSync(flags.file, 'utf8')
    } else if (flags.payload) {
      raw = flags.payload
    } else {
      this.error('Provide --file or --payload with EIP-712 JSON.')
    }

    let payload: TypedDataPayload
    try {
      payload = JSON.parse(raw) as TypedDataPayload
    } catch {
      this.error('Invalid JSON payload.')
    }

    const {domain, message, primaryType, types} = payload
    if (!domain || !types || !primaryType || message === undefined) {
      this.error('Payload must have domain, types, primaryType, and message.')
    }

    const signature = await wallet.signTypedData(
      domain,
      types as Record<string, ethers.TypedDataField[]>,
      message
    )

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
