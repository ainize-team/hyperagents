import { CdpWalletProvider } from "@coinbase/agentkit";
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

Coinbase.configureFromJson({
  filePath: "cdp_api_key.json",
});

const walletDataFile = "./wallet_data.txt";

(async () => {
  // 네트워크 설정(예: base-mainnet)
  const networkId = "base-mainnet";
  const walletConfig = {
    apiKeyName: process.env.CDPNAME!,
    apiKeyPrivateKey: process.env.CDPKEY!,
    networkId: networkId,
  };
  const walletProvider = await CdpWalletProvider.configureWithWallet(
    walletConfig
  );

  // 지갑 내보내기
  const exportedWallet = await walletProvider.exportWallet();
  fs.writeFileSync(walletDataFile, JSON.stringify(exportedWallet, null, 2));

  console.log(`지갑 데이터가 ${walletDataFile}에 저장되었습니다.`);

  const walletData = JSON.parse(fs.readFileSync(walletDataFile, "utf8"));

  console.log(walletData);

  let wallet = await Wallet.import({
    walletId: walletData.walletId,
    seed: walletData.seed,
    networkId: walletData.networkId,
  });
  console.log(wallet);

  const address = await wallet.getDefaultAddress();
  console.log(address);

  const privateKey = address.export();
  console.log(privateKey);
})();
