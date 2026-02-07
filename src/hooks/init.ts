import type {Hook} from '@oclif/core'
import {renderBanner, style} from '../lib/ui.js'

/**
 * Show banner when running with no command or --help / -h (main help).
 */
const init: Hook<'init'> = async function (opts) {
  const {argv} = opts
  const isMainHelp =
    argv.length === 0 ||
    argv[0] === '--help' ||
    argv[0] === '-h'
  if (!isMainHelp) return

  const bin = this.config.bin
  try {
    const banner = await renderBanner(bin)
    if (banner) this.log(style.info(banner))
    this.log('')
    this.log(
      style.dim(
        '  CLI wallet for EVM chains: create wallets, send ETH, call contracts, sign messages.'
      )
    )
    this.log(
      style.dim('  Use a topic below or run') +
        ' ' +
        style.label(`${bin} <topic> --help`) +
        style.dim(' for details.')
    )
    this.log('')
  } catch (_err) {
    this.log(style.info(`  ${bin}`))
    this.log('')
  }
}

export default init
