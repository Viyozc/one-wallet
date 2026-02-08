import {Args, Command, Flags} from '@oclif/core'
import {ethers} from 'ethers'

import {getProvider} from '../../lib/provider.js'
import {style, useFancyUi, withSpinner} from '../../lib/ui.js'

export default class WalletTx extends Command {
  static args = {
    hash: Args.string({
      description: 'Transaction hash (0x-prefixed).',
      required: true,
    }),
  }
  static description = 'Get transaction and receipt by hash (status, block, gasUsed, etc.).'
  static examples = [
    `<%= config.bin %> <%= command.id %> 0x...`,
    `<%= config.bin %> <%= command.id %> 0x... --json`,
  ]
  static flags = {
    json: Flags.boolean({
      default: false,
      description: 'Output full tx + receipt as JSON.',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WalletTx)
    const provider = getProvider()
    const {hash} = args

    if (!ethers.isHexString(hash, 32)) {
      this.error('Invalid transaction hash (expected 32-byte hex with 0x).')
    }

    const fancy = useFancyUi(flags)
    const [tx, receipt] = await withSpinner(
      'Fetching transaction...',
      () =>
        Promise.all([
          provider.getTransaction(hash),
          provider.getTransactionReceipt(hash),
        ]),
      {fancy}
    )

    if (!tx) {
      this.error('Transaction not found.')
    }

    if (flags.json) {
      const txObj = {
        blockHash: tx.blockHash ?? null,
        blockNumber: tx.blockNumber === null ? null : String(tx.blockNumber),
        chainId: tx.chainId === null ? null : Number(tx.chainId),
        data: tx.data,
        from: tx.from,
        gasLimit: tx.gasLimit?.toString() ?? null,
        gasPrice: tx.gasPrice?.toString() ?? null,
        hash: tx.hash,
        nonce: typeof tx.nonce === 'bigint' ? Number(tx.nonce) : tx.nonce,
        to: tx.to,
        value: tx.value.toString(),
      }
      const receiptObj = receipt
        ? {
            blockHash: receipt.blockHash,
            blockNumber: receipt.blockNumber === null ? null : String(receipt.blockNumber),
            cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
            gasUsed: receipt.gasUsed.toString(),
            logs: receipt.logs.length,
            status: typeof receipt.status === 'bigint' ? Number(receipt.status) : receipt.status,
          }
        : null
      this.log(JSON.stringify({...txObj, receipt: receiptObj}))
      return
    }

    this.log(style.label('Hash:') + ' ' + style.txHash(tx.hash))
    this.log(style.label('From:') + ' ' + style.value(tx.from))
    this.log(style.label('To:') + ' ' + style.value(tx.to ?? '(contract creation)'))
    this.log(style.label('Value:') + ' ' + style.value(tx.value.toString() + ' wei'))
    this.log(style.label('Block:') + ' ' + style.value(String(tx.blockNumber ?? 'pending')))
    if (receipt) {
      this.log(
        style.label('Status:') +
          ' ' +
          (receipt.status === 1 ? style.success('success') : style.error('reverted'))
      )
      this.log(style.label('Gas used:') + ' ' + style.value(receipt.gasUsed.toString()))
    } else {
      this.log(style.label('Status:') + ' ' + style.warning('pending (no receipt yet)'))
    }
  }
}
