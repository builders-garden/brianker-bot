export interface Step {
  from: `0x${string}`;
  to: `0x${string}`;
  data: `0x${string}`;
  value: string;
}

export interface Request {
  action: string;
  description: string;
  chainId: number;
  tokenIn: `0x${string}`;
  tokenAmount: string;
  tokenDecimals: number;
  tokenSymbol: string;
  steps: Step[];
  stepsLength: number;
}

export interface TransactionsDataType {
  address: string;
  requests: Request[];
  requestsLength: number;
}
