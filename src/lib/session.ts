import {createCipheriv, createDecipheriv, randomBytes} from 'node:crypto'
import {chmodSync, existsSync, readFileSync, writeFileSync} from 'node:fs'

import {getSessionKeyPath, getSessionPath} from './paths.js'

const ALGORITHM = 'aes-256-gcm'
const KEY_LEN = 32
const IV_LEN = 12
const DEFAULT_TTL_SEC = 300

export interface SessionEntry {
  ct: string
  expiresAt: number
  iv: string
  tag: string
}

export interface SessionData {
  wallets: Record<string, SessionEntry>
}

function getTtlSec(): number {
  const v = process.env.AGENT_WALLET_SESSION_TTL
  if (v === undefined || v === '') return DEFAULT_TTL_SEC
  const n = Number.parseInt(v, 10)
  return Number.isNaN(n) || n < 0 ? DEFAULT_TTL_SEC : n
}

/** Get or create the session encryption key (32 bytes). */
function getOrCreateSessionKey(): Buffer {
  const p = getSessionKeyPath()
  if (existsSync(p)) {
    const buf = readFileSync(p)
    if (buf.length >= KEY_LEN) return buf.subarray(0, KEY_LEN)
  }

  const key = randomBytes(KEY_LEN)
  writeFileSync(p, key, 'binary')
  try {
    chmodSync(p, 0o600)
  } catch {
    // ignore
  }

  return key
}

function encryptWithKey(key: Buffer, plaintext: string): {ct: string; iv: string; tag: string} {
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    ct: enc.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

function decryptWithKey(
  key: Buffer,
  payload: {ct: string; iv: string; tag: string}
): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(payload.iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'))
  return Buffer.concat([
    decipher.update(Buffer.from(payload.ct, 'hex')),
    decipher.final(),
  ]).toString('utf8')
}

function loadSessionRaw(): SessionData {
  const p = getSessionPath()
  if (!existsSync(p)) return {wallets: {}}
  try {
    const raw = readFileSync(p, 'utf8')
    const data = JSON.parse(raw) as SessionData
    return data && typeof data.wallets === 'object' ? data : {wallets: {}}
  } catch {
    return {wallets: {}}
  }
}

/**
 * Get cached password for wallet from session file (decrypt with session key).
 * Returns undefined if missing or expired. Session file stores only encrypted password.
 */
export function getCachedPassword(walletName: string): string | undefined {
  const data = loadSessionRaw()
  const entry = data.wallets[walletName]
  if (!entry || !entry.ct || !entry.iv || !entry.tag || !entry.expiresAt) return undefined
  if (Date.now() >= entry.expiresAt) return undefined
  try {
    const key = getOrCreateSessionKey()
    return decryptWithKey(key, {ct: entry.ct, iv: entry.iv, tag: entry.tag})
  } catch {
    return undefined
  }
}

/**
 * Save password to session file (encrypted with session key). No plaintext on disk.
 */
export function setCachedPassword(walletName: string, password: string): void {
  const key = getOrCreateSessionKey()
  const {ct, iv, tag} = encryptWithKey(key, password)
  const data = loadSessionRaw()
  const ttlSec = getTtlSec()
  data.wallets[walletName] = {
    ct,
    expiresAt: Date.now() + ttlSec * 1000,
    iv,
    tag,
  }
  const p = getSessionPath()
  writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
  try {
    chmodSync(p, 0o600)
  } catch {
    // ignore
  }
}

/**
 * Clear session file (encrypted passwords). Session key file is kept.
 */
export function clearSession(): void {
  const p = getSessionPath()
  if (!existsSync(p)) return
  try {
    writeFileSync(p, JSON.stringify({wallets: {}}, null, 2), 'utf8')
    chmodSync(p, 0o600)
  } catch {
    // ignore
  }
}
