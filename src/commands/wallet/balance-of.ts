import { Args, Command, Flags } from "@oclif/core";
import { ethers } from "ethers";

import { getProvider } from "../../lib/provider.js";
import { style, useFancyUi, withSpinner } from "../../lib/ui.js";

export default class WalletBalanceOf extends Command {
  static aliases = ["balanceOf"];
  static args = {
    address: Args.string({
      description: "Address to query native token balance for.",
      required: true,
    }),
  };
  static description = "Get native token balance of an address.";
  static examples = [
    `<%= config.bin %> <%= command.id %> 0x742d35Cc6634C0532925a3b844Bc454e4438f44e`,
    `<%= config.bin %> <%= command.id %> 0x... --json`,
  ];
  static flags = {
    json: Flags.boolean({
      default: false,
      description: "Output as JSON (wei and ether).",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(WalletBalanceOf);
    if (!ethers.isAddress(args.address)) {
      this.error("Invalid address.");
    }

    const provider = getProvider();
    const fancy = useFancyUi(flags);
    const balance = await withSpinner(
      "Fetching balance...",
      () => provider.getBalance(args.address),
      { fancy }
    );

    if (flags.json) {
      this.log(
        JSON.stringify({
          address: args.address,
          ether: ethers.formatEther(balance),
          wei: balance.toString(),
        })
      );
      return;
    }

    this.log(
      `${style.label(args.address)} ${style.dim(":")} ${style.success(ethers.formatEther(balance) + " ETH")}`
    );
  }
}
