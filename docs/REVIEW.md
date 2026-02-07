# Implementation Review

Review of the current one-wallet implementation: defects, risks, and suggested improvements.

---

## 1. Defects & Inconsistencies

### 1.1 Naming inconsistency (fixed)

- Error messages in `resolve-wallet.ts` referred to `cli-wallet` while the binary is `one-wallet`. **Fixed** to `one-wallet`.

### 1.2 Environment variable prefix

- All env vars use `ONE_WALLET_*` (e.g. `ONE_WALLET_HOME`, `ONE_WALLET_KEY_*`, `ONE_WALLET_PASSWORD_*`, `ONE_WALLET_SESSION_TTL`) while the product is **one-wallet**. For consistency, consider supporting `ONE_WALLET_*` as an alias or migrating in a major version.

### 1.3 Session key file: no rotation

- `session.key` is created once and never rotated. If the key is leaked, all encrypted passwords in `session.json` can be decrypted. **Suggestion:** document that `wallet lock` only clears `session.json`; for full reset (e.g. key compromise), users can delete both `session.json` and `session.key` (or the whole config dir).

### 1.4 wallets.json has no integrity check

- Wallets file is read with `JSON.parse` and no checksum/signature. Corrupted or tampered JSON could lead to wrong data or crashes. **Suggestion:** validate structure (e.g. required fields per entry) and surface a clear error.

### 1.5 No rate limit on password prompt

- Failed decryption (wrong password) has no backoff or limit. A script could repeatedly prompt. **Suggestion:** optional per-wallet attempt counter and short delay after N failures (or document for script use: rely on env var to avoid prompts).

---

## 2. Security Considerations

### 2.1 Session file permissions

- `session.json` and `session.key` are written with `chmod 0o600`. On some Windows setups, chmod may be a no-op. **Suggestion:** document that on Windows, only the current user should have access to the config directory.

### 2.2 Memory clearing

- Decrypted private keys and passwords live in Node.js process memory and are not explicitly zeroed after use. **Suggestion:** for high-security use cases, document that the process should be short-lived or use env-based key injection and avoid long-running daemons holding keys.

### 2.3 Password from env in session

- When password is supplied via `ONE_WALLET_PASSWORD_<NAME>`, it is **not** written to the session file (by design). Session cache is only updated when the user types the password. **Document** this so script users know env is not cached across runs.

---

## 3. Missing or Incomplete Features

### 3.1 No wallet “delete” or “remove”

- There is no command to remove a wallet from `wallets.json`. Users must edit the file manually. **Suggestion:** add `wallet remove <name>` with a confirmation prompt.

### 3.2 Provider set: chainId when using preset

- When using `provider set mainnet`, the RPC URL comes from viem’s preset; it is unclear if `chainId` is always written to `provider.json`. **Suggestion:** ensure presets write both `rpcUrl` and `chainId` so `getChainId()` is correct.

### 3.3 ERC20 / token balance command

- `balance-of` is **native ETH** for an address. There is no dedicated “ERC20 balance” command; users must use `wallet call <token> balanceOf <account> --abi erc20`. **Suggestion:** either document this clearly or add a shortcut (e.g. `wallet token-balance <token> <account> [--decimals 18]`).

### 3.4 Sign typed data: no verify counterpart

- We have `verify-signature` for EIP-191. There is no `verify-typed-data` for EIP-712. **Suggestion:** add a command or extend verify to accept typed-data payload + signature and recover signer.

---

## 4. UX & Robustness

### 4.1 Empty password

- Creating/importing with `--password` allows empty password (prompt twice). Empty password weakens security. **Suggestion:** reject empty password in create/import/set-password (e.g. minimum length or “non-empty” check).

### 4.2 Stdin for password (non-TTY)

- When stdin is not a TTY, password prompt is skipped and the command fails. Piping a password via stdin (e.g. `echo "pass" | one-wallet wallet balance`) does not work. **Suggestion:** document that non-TTY must use `ONE_WALLET_PASSWORD_<NAME>` (or add optional `--password-stdin` flag).

### 4.3 Lock command and session.key

- `wallet lock` clears only `session.json`. `session.key` remains. If an attacker has the key and an old copy of `session.json`, they could decrypt. **Suggestion:** document that “full lock” = delete `session.json` (and optionally `session.key` for paranoia).

---

## 5. Code Quality

### 5.1 Error messages

- Some errors are generic (“Wrong password or corrupted cipher”). **Suggestion:** differentiate “wrong password” (decrypt failure) vs “corrupted payload” (e.g. invalid hex/length) where feasible for easier debugging.

### 5.2 Types and store

- `loadWallets()` return type is asserted from JSON. Legacy entries might have `defaultWallet` or other old keys. **Suggestion:** add a small migration or sanitizer so `WalletEntry` only has `address`, `privateKey?`, `cipher?`, `createdAt?`.

### 5.3 Tests

- No tests found for crypto, session, or resolve-wallet. **Suggestion:** add unit tests for `encryptPrivateKey`/`decryptPrivateKey`, session encrypt/decrypt, and resolve logic (with mocked store).

---

## 6. Documentation

- README should describe: password protection, session (encrypted password + TTL), `wallet lock`, env vars (`ONE_WALLET_*`), and data directory layout (`wallet path`, `session.json`, `session.key`).
- Each command should have at least one concrete example (see updated README).

---

## 7. Summary Table

| Area              | Severity | Status / Suggestion                          |
|-------------------|----------|----------------------------------------------|
| CLI name in errors| Low      | Fixed (one-wallet)                           |
| Env var prefix    | Low      | Document; consider ONE_WALLET_* later        |
| Session key rotation | Low   | Document “full lock” = delete session files  |
| wallets.json validation | Low  | Add structure validation                     |
| Password empty    | Medium   | Reject empty in create/import/set-password   |
| Wallet delete     | Medium   | Add `wallet remove <name>`                   |
| ERC20 balance UX  | Low      | Document or add token-balance                |
| EIP-712 verify    | Low      | Add verify-typed-data                        |
| Tests             | Medium   | Add tests for crypto, session, resolve       |
| README            | -        | Updated with password, session, examples     |
