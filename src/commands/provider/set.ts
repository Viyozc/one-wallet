import { Args, Command, Flags } from "@oclif/core";

import { getDefaultProviderByName } from "../../lib/default-providers.js";
import { saveProvider } from "../../lib/store.js";

export default class ProviderSet extends Command {
  static args = {
    name: Args.string({
      description: "Preset name from provider list (e.g. mainnet, sepolia).",
      required: false,
    }),
  };
  static description =
    "Set current RPC provider by preset name or custom URL + chain ID.";
  static examples = [
    `<%= config.bin %> <%= command.id %> mainnet`,
    `<%= config.bin %> <%= command.id %> sepolia`,
    `<%= config.bin %> <%= command.id %> --rpc-url https://eth.llamarpc.com --chain-id 1`,
    `<%= config.bin %> <%= command.id %> --rpc-url https://... --chain-id 1 --json`,
  ];
  static flags = {
    chainId: Flags.integer({
      description:
        "Chain ID (required when using --rpc-url for custom provider).",
    }),
    json: Flags.boolean({
      default: false,
      description: "Output new provider as JSON.",
    }),
    rpcUrl: Flags.string({
      description:
        "Custom RPC URL (use with --chain-id; omit to use preset by name).",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProviderSet);

    if (args.name) {
      const preset = getDefaultProviderByName(args.name);
      if (!preset) {
        this.error(
          `Unknown preset: ${args.name}. Run "provider list" to see presets.`
        );
      }

      const state = {
        chainId: preset.chainId,
        preset: preset.name,
        rpcUrl: preset.rpcUrl,
      };
      saveProvider(state);
      if (flags.json) {
        this.log(JSON.stringify(state));
        return;
      }

      this.log(`Provider set to "${preset.name}" (chainId=${preset.chainId})`);
      return;
    }

    if (flags.rpcUrl !== undefined) {
      if (flags.chainId === undefined) {
        this.error("--chain-id is required when using --rpc-url");
      }

      const state = { chainId: flags.chainId, rpcUrl: flags.rpcUrl };
      saveProvider(state);
      if (flags.json) {
        this.log(JSON.stringify(state));
        return;
      }

      this.log(`Provider set to custom (chainId=${flags.chainId})`);
      return;
    }

    this.error(
      "Provide a preset name (e.g. mainnet) or --rpc-url with --chain-id"
    );
  }
}
