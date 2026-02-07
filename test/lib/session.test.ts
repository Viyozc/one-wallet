import {existsSync, mkdirSync, readFileSync, rmSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {expect} from 'chai'

import {clearSession, getCachedPassword, setCachedPassword} from '../../src/lib/session.js'

describe('session', () => {
  let tempDir: string
  const originalEnv = process.env.ONE_WALLET_HOME

  before(() => {
    tempDir = path.join(os.tmpdir(), `one-wallet-session-${Date.now()}`)
    mkdirSync(tempDir, {recursive: true})
    process.env.ONE_WALLET_HOME = tempDir
  })

  after(() => {
    process.env.ONE_WALLET_HOME = originalEnv
    if (existsSync(tempDir)) rmSync(tempDir, {recursive: true})
  })

  it('setCachedPassword and getCachedPassword roundtrip', () => {
    setCachedPassword('test-wallet', 'my-secret')
    const got = getCachedPassword('test-wallet')
    expect(got).to.equal('my-secret')
  })

  it('getCachedPassword returns undefined for unknown wallet', () => {
    expect(getCachedPassword('nonexistent')).to.be.undefined
  })

  it('clearSession removes cached passwords', () => {
    setCachedPassword('w2', 'pass2')
    clearSession()
    expect(getCachedPassword('w2')).to.be.undefined
    expect(getCachedPassword('test-wallet')).to.be.undefined
  })
})
