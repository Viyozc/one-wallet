# Optimization Items (from REVIEW.md)

Actionable list derived from [REVIEW.md](./REVIEW.md). Each item includes category, priority, description, and suggested action.

---

## Priority: High (security / correctness)

| # | Category | Item | Action |
|---|----------|------|--------|
| 1 | Security | **Empty password** — Create/import/set-password allow empty password. | Reject empty password in `create`, `import`, `set-password` (e.g. min length or non-empty check). |
| 2 | Security | **Error message too generic** — "Wrong password or corrupted cipher" doesn't help debugging. | Differentiate "wrong password" (decrypt failure) vs "corrupted payload" (invalid hex/length) in `crypto.ts` / resolve flow. |

---

## Priority: Medium (features / robustness)

| # | Category | Item | Action |
|---|----------|------|--------|
| 3 | Feature | **No wallet remove** — Users cannot delete a wallet from CLI. | Add `wallet remove <name>` with confirmation prompt; update `wallets.json` and clear default if needed. |
| 4 | Feature | **Provider preset chainId** — Presets may not always write `chainId` to `provider.json`. | Ensure `provider set <preset>` writes both `rpcUrl` and `chainId` so `getChainId()` is correct. |
| 5 | UX | **Password via stdin (non-TTY)** — Piping password doesn't work; command fails without TTY. | Document use of `AGENT_WALLET_PASSWORD_<NAME>` for non-TTY, or add `--password-stdin` to read password from stdin. |
| 6 | Code | **Store / WalletEntry** — Legacy keys (e.g. `defaultWallet`) may exist; type is asserted from JSON. | Add migration or sanitizer so each entry only has `address`, `privateKey?`, `cipher?`, `createdAt?`; validate on load. |
| 7 | Tests | **No tests for crypto, session, resolve** — Critical paths untested. | Add unit tests: `encryptPrivateKey`/`decryptPrivateKey`, session encrypt/decrypt, resolve logic (mocked store). |

---

## Priority: Low (polish / docs)

| # | Category | Item | Action |
|---|----------|------|--------|
| 8 | Naming | **Env var prefix** — Code uses `AGENT_WALLET_*`, product is one-wallet. | Document current prefix; optionally support `ONE_WALLET_*` as alias or plan migration in major version. |
| 9 | Security | **Session key rotation** — `session.key` never rotates; leak = all session passwords decryptable. | Document that full reset = delete both `session.json` and `session.key`; optionally add `wallet lock --full` to remove both. |
| 10 | Robustness | **wallets.json integrity** — No validation; corrupted/tampered JSON can crash or misbehave. | Validate structure on load (required fields per entry); return clear error on invalid/corrupt file. |
| 11 | Security | **Password attempt rate limit** — No backoff or limit on wrong password. | Optional: per-wallet attempt counter + short delay after N failures; or document to use env in scripts. |
| 12 | Security | **Session file permissions (Windows)** — chmod may be no-op on Windows. | Document that on Windows only current user should have access to config directory. |
| 13 | Security | **Memory clearing** — Keys/passwords not zeroed after use. | Document that for high-security use: short-lived process or env-based key; avoid long-running daemons with keys in memory. |
| 14 | UX | **Lock and session.key** — `wallet lock` only clears `session.json`. | Document "full lock" = delete `session.json` (and optionally `session.key`); or add `--full` to `wallet lock`. |
| 15 | Feature | **ERC20 balance UX** — No dedicated token balance command. | Document `wallet call <token> balanceOf <account> --abi erc20`, or add e.g. `wallet token-balance <token> <account> [--decimals 18]`. |
| 16 | Feature | **EIP-712 verify** — Only EIP-191 verify exists. | Add `verify-typed-data` (or extend verify) to accept typed-data payload + signature and recover signer. |
| 17 | Docs | **Env password not cached** — Password from env is not written to session. | Document in README that when using `AGENT_WALLET_PASSWORD_<NAME>`, session is not updated; each process/run needs env. |

---

## Summary by category

- **Security:** 1, 2, 8, 9, 11, 12, 13, 14, 17  
- **Feature:** 3, 4, 15, 16  
- **UX / Robustness:** 5, 6, 10, 14  
- **Code / Tests:** 6, 7  
- **Documentation:** 8, 9, 12, 13, 14, 17  

---

## Suggested implementation order

1. **Quick wins (docs):** 8, 9, 12, 13, 14, 17 — update README and REVIEW/OPTIMIZATION.  
2. **Security:** 1 (empty password), 2 (error messages).  
3. **Features:** 3 (`wallet remove`), 4 (provider chainId).  
4. **Robustness:** 10 (wallets.json validation), 6 (store sanitizer).  
5. **UX:** 5 (password stdin or doc), 15 (token balance doc or command), 16 (verify-typed-data).  
6. **Tests:** 7 (crypto, session, resolve).  
7. **Optional:** 11 (rate limit), `wallet lock --full`, `ONE_WALLET_*` alias.
