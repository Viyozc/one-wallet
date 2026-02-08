# one-wallet

**A CLI wallet for Ethereum and EVM chains—built for agents, scripts, and automation. Optimized for AI code tools (Claude Code, Cursor, OpenCode, etc.): JSON output, non-interactive flags, and predictable usage.**

Create and manage multiple wallets, query balances, send transactions, call contracts, and sign messages—all from the terminal with optional JSON output for piping into other AI tools.

[![npm version](https://img.shields.io/npm/v/one-wallet.svg)](https://www.npmjs.com/package/one-wallet)
[![Node.js](https://img.shields.io/node/v/one-wallet)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Table of contents

- [one-wallet](#one-wallet)
  - [Table of contents](#table-of-contents)
  - [Features](#features)
  - [Requirements](#requirements)
  - [Installation](#installation)
    - [From npm (recommended)](#from-npm-recommended)
    - [From source](#from-source)
  - [Quick start](#quick-start)
  - [Commands overview](#commands-overview)
    - [Wallet](#wallet)
    - [Provider](#provider)
    - [Other](#other)
  - [Command examples](#command-examples)
    - [Wallet create \& import](#wallet-create--import)
    - [Wallet list, set, path](#wallet-list-set-path)
    - [Balance](#balance)
    - [Contract call (read-only)](#contract-call-read-only)
    - [Send \& estimate](#send--estimate)
    - [Transaction status](#transaction-status)
    - [Signing \& verify](#signing--verify)
    - [Password \& lock](#password--lock)
    - [Remove wallet](#remove-wallet)
    - [Provider](#provider-1)
    - [Other](#other-1)
  - [Preset ABI (call \& send)](#preset-abi-call--send)
  - [Password protection](#password-protection)
  - [Session (unlock cache)](#session-unlock-cache)
  - [Configuration \& environment](#configuration--environment)
    - [Data directory](#data-directory)
    - [Environment variables](#environment-variables)
    - [Default wallet](#default-wallet)
  - [Development](#development)
  - [Contributing](#contributing)
  - [License](#license)

---

## Features

- **Multi-wallet** — Create, list, import (private key or stdin), and switch default wallet by name.
- **Native & contract** — Send ETH, call view/pure methods, or invoke contract writes (e.g. ERC20 `transfer`) with the same `send` command, it also support cast-styled calls with method signature.
- **Preset ABIs** — Use `--abi erc20`, `--abi nft`, `--abi erc721`, `--abi erc1155`, or `--abi erc4626` instead of passing raw ABI JSON.
- **Signing** — EIP-191 message signing, EIP-712 typed data signing, and signature verification / address recovery.
- **Gas & tx** — Estimate gas before sending; fetch transaction status and receipt by hash.
- **Multi-chain** — Built-in RPC presets (mainnet, sepolia, arbitrum, base, polygon, etc.) via `provider set <preset>` or custom URL.
- **Script-friendly** — `--json` on commands for machine-readable output; `-y` to skip send confirmation in non-interactive use.
- **Polished CLI** — Colored output, spinners for async operations, and optional confirmation prompts (when TTY).
- **Password protection** — Optional encryption for stored keys; unlock via password prompt or env; session cache so you don’t re-enter password every command.

---

## Requirements

- **Node.js** ≥ 18

---

## Installation

### From npm (recommended)

```bash
npm install -g one-wallet
# or
yarn global add one-wallet
pnpm add -g one-wallet
```

### From source

```bash
git clone https://github.com/viyozc/one-wallet.git
cd one-wallet
yarn install
yarn build
./bin/run.js --help
```

---

## Quick start

```bash
# 1. Set RPC (preset or custom URL)
one-wallet provider set mainnet
# or: one-wallet provider set https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# 2. Create a wallet and set as default
one-wallet wallet create my-agent --set-default

# 3. Check balance and send ETH
one-wallet wallet balance
one-wallet wallet send 0xRecipientAddress 0.01
```

---

## Commands overview

### Wallet

| Command | Description |
|--------|-------------|
| `wallet create <name>` | Create a new wallet. `--import <key>` to import; `--set-default` to set as default; `--password` for encrypted storage. |
| `wallet import <name>` | Import from private key (`--private-key` or stdin). `--set-default`, `--password` optional. |
| `wallet list` | List all wallets (name, address, default, encrypted). `--json` for machine output. |
| `wallet set [key] [value]` | Get or set global config (e.g. `default` for default wallet). RPC is via `provider` commands. |
| `wallet path` | Print the directory where wallet and config files are stored. |
| `wallet balance [name]` | Native ETH balance of a stored wallet (default wallet if name omitted). |
| `wallet balance-of <address>` | Native ETH balance of any address. |
| `wallet call <contract> <method> [args]` | Read-only contract call. Use `--abi` / `--abi-file`, or cast-style method with quotes: `'name(in)(out)'` (e.g. `'decimals()(uint256)'`). |
| `wallet send <to> [amount]` | Send ETH, or use `--method` / `--args` / `--abi` for contract writes. `-y` skips confirm. |
| `wallet estimate <to> [value]` | Estimate gas (native transfer or contract call, same args as `send`). |
| `wallet tx <hash>` | Get transaction and receipt (status, block, gas used). |
| `wallet sign-message --message <msg>` | EIP-191 sign a message. |
| `wallet sign-typed-data --file <json>` or `--payload <json>` | EIP-712 sign typed data. |
| `wallet verify-signature <message> <signature>` | Recover signer address; optional `--expected <addr>` to verify. |
| `wallet set-password <name>` | Encrypt an existing wallet with a password (prompts for password). |
| `wallet remove-password <name>` | Remove encryption and store plain private key (prompts for current password). |
| `wallet remove <name>` | Remove a wallet from local storage (does not affect keys on-chain). `-y` skips confirmation. |
| `wallet lock` | Clear session cache; next use of encrypted wallets will prompt for password again. |

### Provider

| Command | Description |
|--------|-------------|
| `provider list` | Show current RPC and list built-in chain presets. |
| `provider info` | Show current provider configuration (rpcUrl, chainId, preset; includes env overrides). |
| `provider set <preset>` | Use a preset (e.g. `mainnet`, `sepolia`, `arbitrum`, `base`). |
| `provider set <url>` | Use a custom RPC URL. |

### Other

| Command | Description |
|--------|-------------|
| `help [command]` | Show help for a command. |

---

## Command examples

Below are concrete examples for each main command. Replace placeholders like `<name>`, `<address>`, `<contract>`, `<hash>` with your values.

### Wallet create & import

```bash
# Create a new wallet (plain key stored)
one-wallet wallet create my-agent

# Create and set as default
one-wallet wallet create my-agent --set-default

# Create with password (only encrypted key stored)
one-wallet wallet create my-agent --password --set-default

# Import from private key
one-wallet wallet import prod --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Import with password (encrypted storage)
one-wallet wallet import prod --private-key 0x... --password --set-default
```

### Wallet list, set, path

```bash
# List wallets (human-readable)
one-wallet wallet list

# List as JSON (addresses, default, isEncrypted)
one-wallet wallet list --json

# Show current default wallet
one-wallet wallet set default

# Set default wallet
one-wallet wallet set default my-agent

# Show data directory (wallets, config, session)
one-wallet wallet path
```

### Balance

```bash
# Balance of default wallet
one-wallet wallet balance

# Balance of a named wallet
one-wallet wallet balance my-agent

# Balance of any address (native ETH)
one-wallet wallet balance-of 0x742d35Cc6634C0532925a3b844Bc454e4438f44e

# Balance as JSON (ether + wei)
one-wallet wallet balance-of 0x742d35Cc6634C0532925a3b844Bc454e4438f44e --json
```

### Contract call (read-only)

```bash
# Cast-style (no ABI): use single quotes so shell does not interpret parentheses
one-wallet wallet call 0xToken 'decimals()(uint256)'
one-wallet wallet call 0xToken 'balanceOf(address)(uint256)' 0xAccountAddress
one-wallet wallet call 0xToken 'totalSupply()(uint256)' --json

# With preset ABI
one-wallet wallet call 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 symbol --abi erc20
one-wallet wallet call 0xToken balanceOf 0xAccountAddress --abi erc20
one-wallet wallet call 0xToken allowance 0xAccountAddress,0xAccountAddress2 --abi erc20
one-wallet wallet call 0xNFTContract ownerOf 1 --abi nft
one-wallet wallet call 0xContract getValue --abi-file ./abi.json
```

### Send & estimate

```bash
# Send 0.1 ETH to address (will prompt confirm unless -y)
one-wallet wallet send 0xRecipientAddress 0.1

# Send without confirmation (scripts)
one-wallet wallet send 0xRecipientAddress 0.1 -y

# Estimate gas for same transfer
one-wallet wallet estimate 0xRecipientAddress 0.1

# ERC20 transfer(to, amount)
one-wallet wallet send 0xToken --method transfer --args 0xToAddress,1000000 --abi erc20 -y

# ERC20 approve(spender, amount)
one-wallet wallet send 0xToken --method approve --args 0xSpenderAddress,1000000 --abi erc20 -y

# NFT safeTransferFrom(from, to, tokenId)
one-wallet wallet send 0xNFT --method safeTransferFrom --args 0xFrom,0xTo,1 --abi nft -y

# Output tx hash and receipt as JSON
one-wallet wallet send 0xRecipient 0.01 --wallet my-agent --json
```

### Transaction status

```bash
# Get tx and receipt by hash
one-wallet wallet tx 0xTransactionHash

# Same as JSON
one-wallet wallet tx 0xTransactionHash --json
```

### Signing & verify

```bash
# EIP-191 sign message (default wallet)
one-wallet wallet sign-message --message "Hello, agent"

# Sign and output JSON (message, signature, address)
one-wallet wallet sign-message --message "Hello, agent" --json

# EIP-712 sign typed data from file
one-wallet wallet sign-typed-data --file ./typed-data.json

# EIP-712 sign from inline JSON
one-wallet wallet sign-typed-data --payload '{"types":{...},"primaryType":"Mail","domain":{...},"message":{...}}'

# Recover signer from message + signature
one-wallet wallet verify-signature "Hello, agent" 0xSignatureHex

# Verify that signer matches expected address
one-wallet wallet verify-signature "Hello, agent" 0xSignatureHex --expected 0xRecoveredAddress
```

### Password & lock

```bash
# Encrypt an existing wallet (prompts for new password)
one-wallet wallet set-password my-agent

# Remove encryption (prompts for current password, stores plain key)
one-wallet wallet remove-password my-agent

# Clear session cache; next command will prompt for password again
one-wallet wallet lock
```

### Remove wallet

```bash
# Remove a wallet from storage (prompts for confirmation)
one-wallet wallet remove my-agent

# Skip confirmation (e.g. in scripts)
one-wallet wallet remove old-wallet -y

# Output as JSON
one-wallet wallet remove unused --json
```

### Provider

```bash
# Show current provider config (rpcUrl, chainId, preset)
one-wallet provider info

# List current RPC and available presets
one-wallet provider list

# Use mainnet preset
one-wallet provider set mainnet

# Use custom RPC URL
one-wallet provider set https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### Other

```bash
# Help for a command
one-wallet --help
one-wallet wallet --help
one-wallet wallet send --help
```

---

## Preset ABI (call & send)

For `wallet call` and `wallet send` you can pass a preset name instead of raw ABI:

| Preset | Use case |
|--------|----------|
| `--abi erc20` | balanceOf, totalSupply, symbol, decimals, allowance, transfer, approve, etc. |
| `--abi nft` / `--abi erc721` | balanceOf, ownerOf, tokenURI, safeTransferFrom, etc. |
| `--abi erc1155` | balanceOf, balanceOfBatch, uri, isApprovedForAll, safeTransferFrom, etc. |
| `--abi erc4626` | totalAssets, balanceOf, asset, convertToShares, deposit, withdraw, etc. |

Examples:

```bash
# ERC20 balance and transfer
one-wallet wallet call 0xToken balanceOf 0xAccount --abi erc20
one-wallet wallet send 0xToken --method transfer --args 0xTo,1000000 --abi erc20

# NFT owner and safeTransferFrom
one-wallet wallet call 0xNFT ownerOf 1 --abi nft
one-wallet wallet send 0xNFT --method safeTransferFrom --args 0xFrom,0xTo,1 --abi nft
```

---

## Password protection

- **Create/import with password** — Use `--password` when creating or importing; you will be prompted twice. Only an **encrypted** key (cipher) is stored; the raw private key is never written to disk.
- **Encrypt later** — Use `wallet set-password <name>` to encrypt an existing wallet.
- **Remove encryption** — Use `wallet remove-password <name>`; you must enter the current password; the key is then stored in plain form (use only if you understand the risk).
- **Unlocking** — When a command needs the key for an encrypted wallet, one-wallet will:
  1. Use in-memory key if already decrypted in this process.
  2. Else use **session cache** (encrypted password only; see [Session](#session-unlock-cache)).
  3. Else use env `ONE_WALLET_PASSWORD_<NAME>` if set.
  4. Else prompt for password (only when stdin is a TTY).

**Security:** The private key exists in plain form only in process memory. The session file stores only an **encrypted** password, not the key.

---

## Session (unlock cache)

After you enter the password (e.g. for an encrypted wallet), it can be cached for a short time so the next commands don’t ask again.

- **What is cached** — Only an **encrypted** password in a session file. The session key is stored in a separate file (`session.key`). The **private key is never written to the session**; it is kept only in memory.
- **TTL** — Session entries expire after a number of seconds. Set via env: `ONE_WALLET_SESSION_TTL` (default: `300`).
- **Lock** — Run `one-wallet wallet lock` to clear the session file. The next use of an encrypted wallet will ask for the password again (or use env).
- **Non-interactive** — In scripts or CI, use `ONE_WALLET_PASSWORD_<WALLET_NAME>` to supply the password so no prompt is needed. The password is not written to the session when it comes from env.

---

## Configuration & environment

### Data directory

- Config and wallets are stored under a single directory. Print it with:
  ```bash
  one-wallet wallet path
  ```
- Default: `~/.one-wallet` (or `ONE_WALLET_HOME` if set).
- Files: `wallets.json`, `config.json`, `provider.json`, and (when used) `session.json`, `session.key`.

### Environment variables

| Variable | Description |
|----------|-------------|
| `ONE_WALLET_HOME` | Override config directory (default: `~/.one-wallet`). |
| `ONE_WALLET_RPC_URL` | Override RPC URL (overrides `provider.json`). |
| `ONE_WALLET_CHAIN_ID` | Override chain ID (optional, for custom RPC). |
| `ONE_WALLET_KEY_<NAME>` | Use this value as the private key for wallet `<NAME>`; skips reading from store (e.g. `ONE_WALLET_KEY_MY_AGENT`). |
| `ONE_WALLET_PASSWORD_<NAME>` | Password for encrypted wallet `<NAME>`; avoids prompt (e.g. `ONE_WALLET_PASSWORD_MY_AGENT`). |
| `ONE_WALLET_SESSION_TTL` | Session cache TTL in seconds (default: `300`). |

### Default wallet

- Set via: `one-wallet wallet set default <name>`.
- Or when creating/importing: `--set-default`.

---

## Development

```bash
git clone https://github.com/viyozc/one-wallet.git
cd one-wallet
yarn install
yarn build
yarn test
yarn lint
```

- **Stack:** [oclif](https://oclif.io), [ethers](https://docs.ethers.org/) v6, [viem](https://viem.sh), TypeScript.
- **Commands:** under `src/commands/`; shared lib in `src/lib/`.

---

## Contributing

Contributions are welcome. Please open an issue or a pull request on [GitHub](https://github.com/viyozc/one-wallet).

---

## License

[MIT](LICENSE)
