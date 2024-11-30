import {
  Chain,
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
} from "viem";
import {
  mainnet,
  sepolia,
  base,
  baseSepolia,
  unichainSepolia,
  optimism,
  optimismSepolia,
} from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import { env } from "../env.js";
import { Logger } from "../utils/index.js";
import { brainkerFactory } from "./costants.js";

const logger = new Logger("viem");

const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

const getChain = (chain: string): Chain => {
  let chainToUse: Chain;
  return baseSepolia;
  if (
    chain === "mainnet" ||
    chain === mainnet.id.toString() ||
    chain === "ethereum" ||
    chain === sepolia.id.toString()
  ) {
    chainToUse = sepolia;
  } else if (
    chain === "base" ||
    chain === base.id.toString() ||
    chain === "baseSepolia" ||
    chain === baseSepolia.id.toString()
  ) {
    chainToUse = baseSepolia;
  } else if (
    chain === "unichain" ||
    chain === unichainSepolia.id.toString() ||
    chain === "unichainSepolia" ||
    chain === unichainSepolia.id.toString()
  ) {
    chainToUse = unichainSepolia;
  } else if (
    chain === "optimism" ||
    chain === optimism.id.toString() ||
    chain === "optimismSepolia" ||
    chain === optimismSepolia.id.toString()
  ) {
    chainToUse = optimismSepolia;
  } else {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  return chainToUse;
};

const getWalletClient = (chain: Chain) => {
  return createWalletClient({
    account,
    chain,
    transport: http(),
  });
};
const getPublicClient = (chain: Chain) => {
  return createPublicClient({
    chain,
    transport: http(),
  });
};

export const deployTokenContract = async ({
  name,
  symbol,
  startTime,
  chain,
}: {
  name: string;
  symbol: string;
  startTime: Date;
  chain: string;
}) => {
  const startTimeInEpoch = Math.floor(startTime.getTime() / 1000); // this getTime always returns the time in milliseconds, but we need it in seconds

  try {
    const chainToUse = getChain(chain);
    const walletClient = getWalletClient(chainToUse);
    const publicClient = getPublicClient(chainToUse);
    const contractAddress = brainkerFactory.address[chainToUse.id];
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: brainkerFactory.abi,
      functionName: "launchTokenWithTimeLock",
      args: [name, symbol, BigInt(startTimeInEpoch)],
      account,
      value: BigInt(1e10),
    });
    logger.info(`Token contract deployed with tx hash: ${txHash}`);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const events = parseEventLogs({
      logs: receipt.logs,
      abi: brainkerFactory.abi,
      eventName: ["TokenDeployed"],
    });
    const deployedTokenAddress = events[0].args.deployedERC20Contract;
    logger.info(`Deployed token address: ${deployedTokenAddress}`);

    return deployedTokenAddress;
  } catch (error) {
    logger.error(`Error deploying token contract: ${error}`);
    return null;
  }
};
