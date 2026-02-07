# cli-wallet

**A CLI wallet for Ethereum and EVM chains—built for agents, scripts, and automation.**

Create and manage multiple wallets, query balances, send transactions, call contracts, and sign messages—all from the terminal with optional JSON output for piping into other tools.

[![npm version](https://img.shields.io/npm/v/cli-wallet.svg)](https://www.npmjs.com/package/cli-wallet)
[![Node.js](https://img.shields.io/node/v/cli-wallet)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

- **Multi-wallet** — Create, list, import (private key or stdin), and switch default wallet by name.
- **Native & contract** — Send ETH, call view/pure methods, or invoke contract writes (e.g. ERC20 `transfer`) with the same `send` command.
- **Preset ABIs** — Use `--abi erc20`, `--abi nft`, `--abi erc721`, `--abi erc1155`, or `--abi erc4626` instead of passing raw ABI JSON.
- **Signing** — EIP-191 message signing, EIP-712 typed data signing, and signature verification / address recovery.
- **Gas & tx** — Estimate gas before sending; fetch transaction status and receipt by hash.
- **Multi-chain** — Built-in RPC presets (mainnet, sepolia, arbitrum, base, polygon, etc.) via `provider set <preset>` or custom URL.
- **Script-friendly** — `--json` on commands for machine-readable output; `-y` to skip send confirmation in non-interactive use.
- **Polished CLI** — Colored output, spinners for async operations, and optional confirmation prompts (when TTY).

---

## Requirements

- **Node.js** ≥ 18

---

## Installation

### From npm (recommended)

```bash
npm install -g cli-wallet
# or
yarn global add cli-wallet
pnpm add -g cli-wallet
```

### From source

```bash
git clone https://github.com/viyozc/cli-wallet.git
cd cli-wallet
yarn install
yarn build
./bin/run.js --help
```

---

## Quick start

```bash
# Show welcome and command overview
cli-wallet welcome

# 1. Set RPC (preset or custom URL)
cli-wallet provider set mainnet
# or: cli-wallet provider set https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# 2. Create a wallet and set as default
cli-wallet wallet create my-agent --set-default

# 3. Check balance and send ETH
cli-wallet wallet balance
cli-wallet wallet send 0xRecipientAddress 0.01
```

---

## Commands overview

### Wallet

| Command | Description |
|--------|-------------|
| `wallet create <name>` | Create a new wallet. `--import <key>` to import; `--set-default` to set as default. |
| `wallet import <name>` | Import from private key (`--private-key` or stdin). `--set-default` optional. |
| `wallet list` | List all wallets (name, address, default). `--json` for machine output. |
| `wallet config [key] [value]` | Get or set global config (e.g. `defaultWallet`). RPC is via `provider` commands. |
| `wallet path` | Print the directory where wallet and config files are stored. |
| `wallet balance [name]` | Native ETH balance of a stored wallet (default wallet if name omitted). |
| `wallet balance-of <address>` | Native ETH balance of any address. |
| `wallet call <contract> <method> [args]` | Read-only contract call. Use `--abi <preset>` or `--abi-file <path>`. |
| `wallet send <to> [amount]` | Send ETH, or use `--method` / `--args` / `--abi` for contract writes. `-y` skips confirm. |
| `wallet estimate <to> [value]` | Estimate gas (native transfer or contract call, same args as `send`). |
| `wallet tx <hash>` | Get transaction and receipt (status, block, gas used). |
| `wallet sign-message --message <msg>` | EIP-191 sign a message. |
| `wallet sign-typed-data --file <json>` or `--payload <json>` | EIP-712 sign typed data. |
| `wallet verify-signature <message> <signature>` | Recover signer address; optional `--expected <addr>` to verify. |

### Provider

| Command | Description |
|--------|-------------|
| `provider list` | Show current RPC and list built-in chain presets. |
| `provider set <preset>` | Use a preset (e.g. `mainnet`, `sepolia`, `arbitrum`, `base`). |
| `provider set <url>` | Use a custom RPC URL. |

### Other

| Command | Description |
|--------|-------------|
| `welcome` | Print ASCII banner and short intro. |
| `help [command]` | Show help for a command. |

---

## Preset ABI (call & send)

For `wallet call` and `wallet send` you can pass a preset name instead of raw ABI:

- `--abi erc20` — balanceOf, totalSupply, symbol, decimals, allowance, etc.
- `--abi nft` / `--abi erc721` — balanceOf, ownerOf, tokenURI, etc.
- `--abi erc1155` — balanceOf, balanceOfBatch, uri, isApprovedForAll, etc.
- `--abi erc4626` — vault (totalAssets, balanceOf, asset, convertToShares, etc.)

Examples:

```bash
# ERC20 balance and transfer
cli-wallet wallet call 0xToken balanceOf 0xAccount --abi erc20
cli-wallet wallet send 0xToken --method transfer --args 0xTo,1000000 --abi erc20

# NFT owner and safeTransferFrom
cli-wallet wallet call 0xNFT ownerOf 1 --abi nft
cli-wallet wallet send 0xNFT --method safeTransferFrom --args 0xFrom,0xTo,1 --abi nft
```

---

## Configuration & data

- **Config / wallets** — Stored under the CLI data directory (see `wallet path`). Same layout as other [oclif](https://oclif.io) apps.
- **RPC** — Set via `provider set` or env: `AGENT_WALLET_RPC_URL`, `AGENT_WALLET_CHAIN_ID`.
- **Default wallet** — `wallet config defaultWallet <name>` or when creating/importing with `--set-default`.
- **Override key per wallet** — `AGENT_WALLET_KEY_<WALLET_NAME>` (e.g. `AGENT_WALLET_KEY_MY_AGENT`) to use that env value instead of the stored key.

---

## Examples

```bash
# Create and use a wallet
cli-wallet wallet create bot --set-default
cli-wallet wallet balance

# Import from private key (or stdin for security)
cli-wallet wallet import prod --private-key 0x...
echo "$PRIVATE_KEY" | cli-wallet wallet import staging

# Query any address balance
cli-wallet wallet balance-of 0x742d35Cc6634C0532925a3b844Bc454e4438f44e

# Contract read with preset ABI
cli-wallet wallet call 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 symbol --abi erc20
cli-wallet wallet call 0xA0b8... totalSupply --abi erc20 --json

# Estimate gas then send (with optional confirmation)
cli-wallet wallet estimate 0xRecipient 0.1
cli-wallet wallet send 0xRecipient 0.1 -y

# ERC20 approve and transfer
cli-wallet wallet send 0xToken --method approve --args 0xSpender,1000000 --abi erc20 -y
cli-wallet wallet send 0xToken --method transfer --args 0xTo,1000000 --abi erc20 -y

# Sign message and verify
cli-wallet wallet sign-message --message "Hello, agent" --json
cli-wallet wallet verify-signature "Hello, agent" 0x... --expected 0xRecoveredAddress

# Transaction status
cli-wallet wallet tx 0x...
cli-wallet wallet tx 0x... --json
```

---

## Development

```bash
git clone https://github.com/viyozc/cli-wallet.git
cd cli-wallet
yarn install
yarn build
yarn test
yarn lint
```

- **Stack:** [oclif](https://oclif.io), [ethers](https://docs.ethers.org/) v6, [viem](https://viem.sh) (chains & preset ABIs), TypeScript.
- **Commands:** under `src/commands/`; shared lib in `src/lib/`.

---

## Contributing

Contributions are welcome. Please open an issue or a pull request on [GitHub](https://github.com/viyozc/cli-wallet).

---

## License

[MIT](LICENSE)
