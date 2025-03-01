import { Contract, ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";


const DHAO_CONTRACT_ADDRESS = "0x8a8137503C50873b853b79C5E6833B7035e8EF4B";
const DHAO_ABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../contracts/abis/dhaoAbi.json"), "utf8"));

export async function getDHAOContract(privateKey: string) {
  if (!process.env.BASE_RPC_URL) {
    throw new Error("BASE_RPC_URL is not set");
  }
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL,{
    name: "base",
    chainId: 8453,
  });

  const signer = new ethers.Wallet(privateKey, provider);
  const contract = new Contract(DHAO_CONTRACT_ADDRESS, DHAO_ABI);
  return contract.connect(signer);
}

export function dhaoContract(privateKey: string) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);
  const contract = new Contract(DHAO_CONTRACT_ADDRESS, DHAO_ABI, signer);
  return contract;
}
