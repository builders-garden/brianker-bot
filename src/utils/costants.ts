import {
  baseSepolia,
  sepolia,
  unichainSepolia,
  optimismSepolia,
} from "viem/chains";

export const SUPPORTED_CHAINS = [
  unichainSepolia,
  baseSepolia,
  sepolia,
  optimismSepolia,
];

export const brainkerFactory = {
  address: {
    [sepolia.id]: "0xec0ddA4eDc7C130f4EDc08b8188D0daD658488c0",
    [baseSepolia.id]: "0xec0ddA4eDc7C130f4EDc08b8188D0daD658488c0",
    [unichainSepolia.id]: "0xec0ddA4eDc7C130f4EDc08b8188D0daD658488c0",
    [optimismSepolia.id]: "0xec0ddA4eDc7C130f4EDc08b8188D0daD658488c0",
  } as Record<number, `0x${string}`>,
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "deployedERC20Contract",
          type: "address",
        },
      ],
      name: "TokenDeployed",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "name",
          type: "string",
        },
        {
          internalType: "string",
          name: "symbol",
          type: "string",
        },
        {
          internalType: "uint256",
          name: "startTime",
          type: "uint256",
        },
      ],
      name: "launchTokenWithTimeLock",
      outputs: [
        {
          internalType: "address",
          name: "deployedToken",
          type: "address",
        },
      ],
      stateMutability: "payable",
      type: "function",
    },
  ],
} as const;
