import {createCipheriv, createDecipheriv, randomBytes, scryptSync} from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LEN = 32
const IV_LEN = 12
const SALT_LEN = 16
const SCRYPT_N = 16_384
const SCRYPT_R = 8
const SCRYPT_P = 1

export interface CipherPayload {
  ct: string
  iv: string
  salt: string
  tag: string
}

/**
 * Derive a 32-byte key from password and salt using scrypt.
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LEN, {N: SCRYPT_N, p: SCRYPT_P, r: SCRYPT_R})
}

/**
 * Encrypt a private key (hex string) with a password. Returns payload as hex strings for JSON storage.
 */
export function encryptPrivateKey(password: string, privateKeyHex: string): CipherPayload {
  const salt = randomBytes(SALT_LEN)
  const iv = randomBytes(IV_LEN)
  const key = deriveKey(password, salt)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const plain = Buffer.from(privateKeyHex.replace(/^0x/, ''), 'hex')
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    ct: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    tag: tag.toString('hex'),
  }
}

/**
 * Decrypt a cipher payload with the password. Returns private key as hex string (with 0x).
 */
export function decryptPrivateKey(password: string, payload: CipherPayload): string {
  const key = deriveKey(password, Buffer.from(payload.salt, 'hex'))
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(payload.iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'))
  const plain = Buffer.concat([
    decipher.update(Buffer.from(payload.ct, 'hex')),
    decipher.final(),
  ])
  const hex = plain.toString('hex')
  return hex.startsWith('0x') ? hex : `0x${hex}`
}
