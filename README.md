# agent-wallet

基于 [oclif](https://oclif.io) 的以太坊钱包 CLI，用于创建/管理本地钱包、查询余额、发送 ETH 及调用合约。适合脚本或 Agent 集成。

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/agent-wallet.svg)](https://npmjs.org/package/agent-wallet)
[![Downloads/week](https://img.shields.io/npm/dw/agent-wallet.svg)](https://npmjs.org/package/agent-wallet)

## 环境要求

- Node.js >= 18.0.0

## 安装

```bash
# 从 npm 全局安装
npm install -g agent-wallet

# 或使用 yarn
yarn global add agent-wallet
```

从源码运行（开发）：

```bash
git clone https://github.com/viyozc/agent-wallet.git
cd agent-wallet
yarn install
yarn build
./bin/run.js wallet list
```

## 快速开始

1. **配置 RPC**（必选，否则无法查询链上数据）：

   ```bash
   agent-wallet wallet config rpcUrl https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
   agent-wallet wallet config chainId 1
   ```

2. **创建或导入钱包**：

   ```bash
   agent-wallet wallet create my-agent
   agent-wallet wallet create my-agent --import <private-key> --set-default
   ```

3. **查看余额 / 发送 ETH**：

   ```bash
   agent-wallet wallet balance
   agent-wallet wallet send 0xRecipientAddress 0.1
   ```

## 配置项 (wallet config)

| 键名           | 说明           |
|----------------|----------------|
| `defaultWallet` | 默认使用的钱包别名 |
| `rpcUrl`       | JSON-RPC 节点 URL |
| `chainId`      | 链 ID（如 1=主网） |

查看当前配置：

```bash
agent-wallet wallet config
agent-wallet wallet config --json
```

## 命令概览

### 钱包 (wallet)

| 命令 | 说明 |
|------|------|
| `wallet create <name>` | 创建新钱包；`--import <key>` 导入私钥，`--set-default` 设为默认 |
| `wallet list` | 列出所有已存钱包（名称与地址），`--json` 输出 JSON |
| `wallet config [key] [value]` | 查看或设置全局配置（defaultWallet / rpcUrl / chainId） |
| `wallet balance [wallet]` | 查询指定钱包的 ETH 余额，省略则用默认钱包 |
| `wallet balance-of <token> [wallet]` | 查询 ERC20 余额，`--decimals` 指定精度（默认 18） |
| `wallet call <contract> <method> [args]` | 只读调用合约（view/pure），需 `--abi` 或 `--abi-file` |
| `wallet send <to> [amount]` | 发送原生 ETH；或带 `--method`/`--args`/`--abi-file` 做合约写调用 |

### 其他

- `agent-wallet hello PERSON --from <name>` / `agent-wallet hello world`：示例命令
- `agent-wallet help [COMMAND]`：查看帮助
- `agent-wallet plugins`：插件管理（见 [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins)）

## 使用示例

```bash
# 创建并设为默认
agent-wallet wallet create my-agent --set-default

# 查询 ETH 与 USDC 余额（USDC 6 位小数）
agent-wallet wallet balance
agent-wallet wallet balance-of 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 --decimals 6

# 只读调用合约
agent-wallet wallet call 0xContract totalSupply --abi-file ./abi.json --json

# 发送 ETH
agent-wallet wallet send 0xRecipient 0.1 --wallet my-agent --json

# ERC20 转账（通过 send 调用 transfer）
agent-wallet wallet send 0xTokenContract --method transfer --args 0xTo,1000000 --abi-file ./erc20.json
```

## 数据存储

- 钱包与配置保存在本地（由 oclif 的 `config.dir` / 数据目录决定）。
- 私钥仅存于本机，请勿将数据目录提交或上传到不信任环境。

## 开发

```bash
yarn install
yarn build          # 编译 TypeScript
yarn test           # 运行测试
yarn lint           # ESLint
```

## License

MIT
