import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {expect} from 'chai'

import {loadWallets, saveWallets} from '../../src/lib/store.js'

describe('store', () => {
  let tempDir: string
  const originalEnv = process.env.ONE_WALLET_HOME

  before(() => {
    tempDir = path.join(os.tmpdir(), `one-wallet-test-${Date.now()}`)
    mkdirSync(tempDir, {recursive: true})
    process.env.ONE_WALLET_HOME = tempDir
  })

  after(() => {
    process.env.ONE_WALLET_HOME = originalEnv
    if (existsSync(tempDir)) rmSync(tempDir, {recursive: true})
  })

  describe('loadWallets / saveWallets', () => {
    it('returns empty when file does not exist', () => {
      const p = path.join(tempDir, 'one-wallet', 'wallets.json')
      if (existsSync(p)) rmSync(p, {force: true})
      const data = loadWallets()
      expect(data.wallets).to.deep.equal({})
    })

    it('sanitizes entries and validates address', () => {
      const configDir = path.join(tempDir, 'one-wallet')
      if (!existsSync(configDir)) mkdirSync(configDir, {recursive: true})
      const p = path.join(configDir, 'wallets.json')
      writeFileSync(
        p,
        JSON.stringify({
          wallets: {
            good: {
              address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
              privateKey: '0xab',
              createdAt: '2025-01-01T00:00:00.000Z',
            },
            badAddress: {address: 'not-an-address', privateKey: '0xcd'},
            badEntry: null,
            legacy: {
              address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
              defaultWallet: true,
              extra: 'ignored',
            },
          },
        }),
        'utf8'
      )
      const data = loadWallets()
      expect(Object.keys(data.wallets)).to.include('good')
      expect(Object.keys(data.wallets)).to.include('legacy')
      expect(Object.keys(data.wallets)).not.to.include('badAddress')
      expect(Object.keys(data.wallets)).not.to.include('badEntry')
      const good = data.wallets['good']!
      expect(good.address).to.equal('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')
      expect(good.privateKey).to.equal('0xab')
      expect((good as any).defaultWallet).to.be.undefined
      expect((good as any).extra).to.be.undefined
    })

    it('throws on invalid JSON', () => {
      const configDir = path.join(tempDir, 'one-wallet')
      const p = path.join(configDir, 'wallets.json')
      writeFileSync(p, '{ invalid json', 'utf8')
      expect(() => loadWallets()).to.throw('wallets.json: invalid JSON')
    })
  })
})
