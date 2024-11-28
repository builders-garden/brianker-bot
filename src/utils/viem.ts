import {
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
} from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import { env } from "../env.js";
import { Logger } from "../utils/index.js";
import { brainkerFactory } from "./costants.js";

const logger = new Logger("viem");

const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export const deployTokenContract = async ({
  name,
  symbol,
  startTime,
}: {
  name: string;
  symbol: string;
  startTime: Date;
}) => {
  const startTimeInEpoch = startTime.getTime();

  try {
    const txHash = await walletClient.writeContract({
      address: brainkerFactory.address,
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
