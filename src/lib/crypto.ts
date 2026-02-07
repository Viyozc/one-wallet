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

/** Thrown when decryption fails due to wrong password (auth tag mismatch). */
export class WrongPasswordError extends Error {
  constructor() {
    super('Wrong password.')
    this.name = 'WrongPasswordError'
  }
}

/** Thrown when cipher payload is invalid (bad hex, missing fields, or corrupted). */
export class CorruptedCipherError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CorruptedCipherError'
  }
}

function isHexString(s: string, minBytes = 1): boolean {
  const cleaned = s.replace(/^0x/, '')
  return /^[0-9a-fA-F]+$/.test(cleaned) && cleaned.length >= minBytes * 2
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
  if (!password || !password.trim()) {
    throw new Error('Password cannot be empty.')
  }

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
 * @throws WrongPasswordError when password is wrong (auth tag mismatch)
 * @throws CorruptedCipherError when payload is invalid or corrupted
 */
export function decryptPrivateKey(password: string, payload: CipherPayload): string {
  if (
    !payload ||
    typeof payload.ct !== 'string' ||
    typeof payload.iv !== 'string' ||
    typeof payload.salt !== 'string' ||
    typeof payload.tag !== 'string'
  ) {
    throw new CorruptedCipherError('Cipher payload missing required fields (ct, iv, salt, tag).')
  }

  if (
    !isHexString(payload.ct, 1) ||
    !isHexString(payload.iv, IV_LEN) ||
    !isHexString(payload.salt, SALT_LEN) ||
    !isHexString(payload.tag, 16)
  ) {
    throw new CorruptedCipherError('Cipher payload has invalid or truncated hex fields.')
  }

  const key = deriveKey(password, Buffer.from(payload.salt, 'hex'))
  let decipher: ReturnType<typeof createDecipheriv>
  try {
    decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(payload.iv, 'hex')
    )
    ;(decipher as unknown as {setAuthTag: (tag: Buffer) => void}).setAuthTag(Buffer.from(payload.tag, 'hex'))
  } catch (error) {
    throw new CorruptedCipherError((error as Error).message)
  }

  try {
    const plain = Buffer.concat([
      decipher.update(Buffer.from(payload.ct, 'hex')),
      decipher.final(),
    ])
    const hex = plain.toString('hex')
    return hex.startsWith('0x') ? hex : `0x${hex}`
  } catch (error) {
    const msg = (error as Error).message ?? ''
    if (
      msg.includes('Unsupported state or unable to authenticate') ||
      msg.includes('auth tag') ||
      msg.includes('BAD_DECRYPT')
    ) {
      throw new WrongPasswordError()
    }

    throw new CorruptedCipherError(msg || 'Decryption failed.')
  }
}
