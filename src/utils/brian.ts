import { TransactionResult } from "@brian-ai/sdk";
import { TransactionsDataType, Request } from "./types.js";

/**
 * A function that takes the Brian SDK response and generates the data payload that will be read by the frame handler
 * @param data - The data from the Brian SDK response
 * @param senderAddress - The address of the sender of the transactions
 * @returns The data payload ready to be read by the frame handler
 */
export const generateFrameDataPayload = async (
  data: TransactionResult[],
  senderAddress: string
): Promise<TransactionsDataType> => {
  const requestsLength = data.length;
  let stepsLength: number[] = [];
  for (let i = 0; i < requestsLength; i++) {
    stepsLength.push(data[i].data.steps?.length || 0);
  }
  // require length of transactions > stepsLength
  if (!stepsLength) {
    throw new Error("No transactions found");
  }
  //Define the requests array
  const requests: Request[] = [];
  for (let i = 0; i < requestsLength; i++) {
    const resultData = data[i].data;
    const request: Request = {
      action: data[i].action,
      description: resultData.description,
      chainId: resultData.steps![0].chainId,
      tokenIn: resultData.fromToken!.address,
      tokenAmount: resultData.fromAmount!.toString(),
      tokenDecimals: resultData.fromToken!.decimals,
      tokenSymbol: resultData.fromToken!.symbol,
      steps: [],
      stepsLength: stepsLength[i],
    };

    for (let j = 0; j < (stepsLength[i] || 0); j++) {
      const step = resultData.steps![j];
      request.steps.push({
        from: step.from,
        to: step.to,
        data: step.data,
        value: step.value,
      });
    }
    requests.push(request);
  }

  // Data to store for the Frame transaction
  return {
    address: senderAddress,
    requests: requests,
    requestsLength: requestsLength,
  };
};
