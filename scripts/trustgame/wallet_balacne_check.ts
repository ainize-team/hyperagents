import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import * as fs from "fs";

Coinbase.configureFromJson({
  filePath: "cdp_api_key.json",
});

async function main() {
  const walletData = JSON.parse(fs.readFileSync("wallet_data.txt", "utf8"));

  let wallet = await Wallet.import({
    walletId: walletData.walletId,
    seed: walletData.seed,
    networkId: walletData.networkId,
  });
  console.log(wallet);

  const address = await wallet.getDefaultAddress();
  console.log(address);

  let balance = await wallet.listBalances();
  console.log(balance);

  const privateKey = address.export();
  console.log(privateKey);
}

main();
