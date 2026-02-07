import {expect} from 'chai'

import {
  CorruptedCipherError,
  encryptPrivateKey,
  decryptPrivateKey,
  WrongPasswordError,
} from '../../src/lib/crypto.js'

const VALID_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

describe('crypto', () => {
  describe('encryptPrivateKey', () => {
    it('encrypts and decrypts roundtrip', () => {
      const payload = encryptPrivateKey('secret', VALID_KEY)
      expect(payload).to.have.keys('ct', 'iv', 'salt', 'tag')
      expect(payload.ct).to.match(/^[0-9a-f]+$/)
      const dec = decryptPrivateKey('secret', payload)
      expect(dec).to.equal(VALID_KEY.startsWith('0x') ? VALID_KEY : `0x${VALID_KEY}`)
    })

    it('throws on empty password', () => {
      expect(() => encryptPrivateKey('', VALID_KEY)).to.throw('Password cannot be empty')
      expect(() => encryptPrivateKey('   ', VALID_KEY)).to.throw('Password cannot be empty')
    })
  })

  describe('decryptPrivateKey', () => {
    it('throws WrongPasswordError on wrong password', () => {
      const payload = encryptPrivateKey('right', VALID_KEY)
      expect(() => decryptPrivateKey('wrong', payload)).to.throw(WrongPasswordError, 'Wrong password')
    })

    it('throws CorruptedCipherError on missing fields', () => {
      expect(() =>
        decryptPrivateKey('x', {ct: 'ab', iv: 'ab', salt: 'ab', tag: 'ab'} as any)
      ).to.throw(CorruptedCipherError, 'invalid or truncated hex')
      expect(() => decryptPrivateKey('x', {} as any)).to.throw(CorruptedCipherError, 'missing required fields')
    })

    it('throws on tampered ciphertext (wrong password or corrupted)', () => {
      const payload = encryptPrivateKey('secret', VALID_KEY)
      const tampered = {...payload, ct: payload.ct.slice(0, -2) + 'ff'}
      expect(() => decryptPrivateKey('secret', tampered)).to.throw()
    })
  })
})
