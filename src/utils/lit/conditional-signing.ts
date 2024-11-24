import { LitNodeClient } from "@lit-protocol/lit-node-client";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { LIT_RPC, LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import {
  createSiweMessage,
  generateAuthSig,
  LitActionResource,
  LitPKPResource
} from "@lit-protocol/auth-helpers";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import * as ethers from "ethers";

import { litActionCode } from "./lit-action.js";
import { getEnv } from "./utils.js";

const ETHEREUM_PRIVATE_KEY = getEnv("ETHEREUM_PRIVATE_KEY");
const CHAIN_TO_CHECK_CONDITION_ON = getEnv("CHAIN_TO_CHECK_CONDITION_ON");

export const conditionalSigning = async () => {
  let litNodeClient: LitNodeClient;
  let pkpInfo: {
    tokenId?: string;
    publicKey?: string;
    ethAddress?: string;
  } = {};

  try {
    const ethersWallet = new ethers.Wallet(
      ETHEREUM_PRIVATE_KEY,
      new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
    );

    console.log("🔄 Connecting to the Lit network...");
    litNodeClient = new LitJsSdk.LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug: false,
    });
    await litNodeClient.connect();
    console.log("✅ Connected to the Lit network");

    console.log("🔄 Connecting LitContracts client to network...");
    const litContracts = new LitContracts({
      signer: ethersWallet,
      network: LIT_NETWORK.Datil,
      debug: false,
    });
    await litContracts.connect();
    console.log("✅ Connected LitContracts client to network");

    console.log("🔄 PKP wasn't provided, minting a new one...");
    pkpInfo = (await litContracts.pkpNftContractUtils.write.mint()).pkp;
    console.log("✅ PKP successfully minted");
    console.log(`📄  PKP token ID: ${pkpInfo.tokenId}`);
    console.log(`📄  PKP public key: ${pkpInfo.publicKey}`);
    console.log(`📄  PKP ETH address: ${pkpInfo.ethAddress}`);
    // ethAddress: ethers.utils.computeAddress(`0x${LIT_PKP_PUBLIC_KEY}`)

    console.log("🔄 No Capacity Credit provided, minting a new one...");
    const capacityTokenId = (
      await litContracts.mintCapacityCreditsNFT({
        requestsPerKilosecond: 80,
        daysUntilUTCMidnightExpiration: 2,
      })
    ).capacityTokenIdStr;
    console.log(`✅ Minted new Capacity Credit with ID: ${capacityTokenId}`);

    console.log("🔄 Creating capacityDelegationAuthSig...");
    const { capacityDelegationAuthSig } =
      await litNodeClient.createCapacityDelegationAuthSig({
        uses: "1",
        dAppOwnerWallet: ethersWallet,
        capacityTokenId,
        delegateeAddresses: [ethersWallet.address],
      });
    console.log("✅ Capacity Delegation Auth Sig created");

    console.log("🔄 Executing Lit Action...");
    const litActionSignatures = await litNodeClient.executeJs({
      sessionSigs: await litNodeClient.getSessionSigs({
        chain: CHAIN_TO_CHECK_CONDITION_ON,
        capabilityAuthSigs: [capacityDelegationAuthSig],
        expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24h
        resourceAbilityRequests: [
          { 
            resource: new LitPKPResource("*"), 
            ability: LIT_ABILITY.PKPSigning,
          },
          {
            resource: new LitActionResource("*"),
            ability: LIT_ABILITY.LitActionExecution,
          },
        ],
        authNeededCallback: async ({
          resourceAbilityRequests,
          expiration,
          uri,
        }) => {
          const toSign = await createSiweMessage({
            uri: uri!,
            expiration: expiration!, // 24 hours
            resources: resourceAbilityRequests!,
            walletAddress: await ethersWallet.getAddress(),
            nonce: await litNodeClient.getLatestBlockhash(), // important to use latest blockhash as nonce
            litNodeClient: litNodeClient,
          });

          return await generateAuthSig({
            signer: ethersWallet,
            toSign,
          });
        },
      }),
      code: litActionCode,
      jsParams: {
        conditions: [
          {
            conditionType: "evmBasic",
            contractAddress: "",
            standardContractType: "",
            chain: CHAIN_TO_CHECK_CONDITION_ON,
            method: "eth_getBalance",
            parameters: [":userAddress", "latest"],
            returnValueTest: {
              comparator: ">",
              value: "0",
            },
          },
        ],
        authSig: await (async () => {
          const toSign = await createSiweMessage({
            uri: "http://localhost",
            expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
            walletAddress: await ethersWallet.getAddress(),
            nonce: await litNodeClient.getLatestBlockhash(),
            resources: [
              { 
                resource: new LitPKPResource("*"), 
                ability: LIT_ABILITY.PKPSigning,
              },
              {
                resource: new LitActionResource("*"),
                ability: LIT_ABILITY.LitActionExecution,
              },
            ],
            litNodeClient: litNodeClient,
          });
          return await generateAuthSig({
            signer: ethersWallet,
            toSign,
          });
        })(),
        chain: CHAIN_TO_CHECK_CONDITION_ON,
        dataToSign: ethers.utils.arrayify(ethers.utils.keccak256([1, 2, 3, 4, 5])),
        publicKey: pkpInfo.publicKey,
      },
    });
    console.log("✅ Lit Action executed successfully");

    return litActionSignatures;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    litNodeClient!.disconnect();
  }
};