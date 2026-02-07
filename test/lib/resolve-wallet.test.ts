import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {expect} from 'chai'

import {encryptPrivateKey} from '../../src/lib/crypto.js'
import {resolveWalletPrivateKey} from '../../src/lib/resolve-wallet.js'
import {clearSession} from '../../src/lib/session.js'
import {getConfigPath, getWalletsPath} from '../../src/lib/paths.js'

describe('resolve-wallet', () => {
  let tempDir: string
  const originalEnv = process.env.ONE_WALLET_HOME
  const originalKey = process.env.ONE_WALLET_KEY_TEST
  const originalPass = process.env.ONE_WALLET_PASSWORD_TEST

  before(() => {
    tempDir = path.join(os.tmpdir(), `one-wallet-resolve-${Date.now()}`)
    mkdirSync(tempDir, {recursive: true})
    process.env.ONE_WALLET_HOME = tempDir
  })

  after(() => {
    process.env.ONE_WALLET_HOME = originalEnv
    if (process.env.ONE_WALLET_KEY_TEST !== undefined) delete process.env.ONE_WALLET_KEY_TEST
    if (process.env.ONE_WALLET_PASSWORD_TEST !== undefined) delete process.env.ONE_WALLET_PASSWORD_TEST
    if (originalKey !== undefined) process.env.ONE_WALLET_KEY_TEST = originalKey
    if (originalPass !== undefined) process.env.ONE_WALLET_PASSWORD_TEST = originalPass
    if (existsSync(tempDir)) rmSync(tempDir, {recursive: true})
  })

  function writeWallets(json: object) {
    const dir = path.join(tempDir, 'one-wallet')
    if (!existsSync(dir)) mkdirSync(dir, {recursive: true})
    writeFileSync(getWalletsPath(), JSON.stringify(json), 'utf8')
  }

  function writeConfig(config: {default?: string}) {
    const dir = path.join(tempDir, 'one-wallet')
    if (!existsSync(dir)) mkdirSync(dir, {recursive: true})
    writeFileSync(getConfigPath(), JSON.stringify(config), 'utf8')
  }

  it('resolves plain private key from store when default is set', async () => {
    const pk = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    writeWallets({
      wallets: {
        alice: {
          address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          privateKey: pk,
        },
      },
    })
    writeConfig({default: 'alice'})
    const {name, privateKey} = await resolveWalletPrivateKey()
    expect(name).to.equal('alice')
    expect(privateKey).to.equal(pk)
  })

  it('resolves encrypted wallet when ONE_WALLET_PASSWORD_<name> is set', async () => {
    clearSession()
    const pk = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    const cipher = encryptPrivateKey('mypass', pk)
    writeWallets({
      wallets: {
        enc: {
          address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          cipher,
        },
      },
    })
    writeConfig({default: 'enc'})
    process.env.ONE_WALLET_PASSWORD_ENC = 'mypass'
    const {name, privateKey} = await resolveWalletPrivateKey()
    expect(name).to.equal('enc')
    expect(privateKey).to.equal(pk)
  })

  it('throws when no default wallet', async () => {
    writeWallets({wallets: {}})
    writeConfig({})
    try {
      await resolveWalletPrivateKey()
      expect.fail('should have thrown')
    } catch (e) {
      expect((e as Error).message).to.match(/No wallet specified and no default wallet/)
    }
  })

  it('throws when wallet not found', async () => {
    writeWallets({wallets: {}})
    writeConfig({default: 'missing'})
    try {
      await resolveWalletPrivateKey()
      expect.fail('should have thrown')
    } catch (e) {
      expect((e as Error).message).to.match(/Wallet "missing" not found/)
    }
  })
})
