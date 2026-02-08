import type {Hook} from '@oclif/core'
import {renderBanner, style} from '../lib/ui.js'

/**
 * Show banner and short intro when running root help (one-wallet --help or one-wallet help).
 */
const prerun: Hook<'prerun'> = async function (opts) {
  const {Command, argv} = opts
  const id = Command?.id ?? ''
  const noTopic =
    !argv ||
    argv.length === 0 ||
    (argv.length === 1 && (argv[0] === '--help' || argv[0] === '-h'))
  const isRootHelp = id === 'help' && noTopic
  if (!isRootHelp) return

  const bin = this.config.bin
  try {
    const banner = await renderBanner(bin)
    this.log(style.info(banner))
    this.log('')
    this.log(style.dim('  CLI wallet for EVM chains: create wallets, send ETH, call contracts, sign messages.'))
    this.log(style.dim('  Use a topic below or run') + ' ' + style.label(`${bin} <topic> --help`) + style.dim(' for details.'))
    this.log('')
  } catch {
    // If figlet fails, skip banner
  }
}

export default prerun
