// Minimal PharmaGuard ABI — only the functions the backend signs.
export const PHARMA_ABI = [
  {
    type: "function",
    name: "mintProduct",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "id", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "name", type: "string" },
      { name: "batchNumber", type: "string" },
      { name: "expiryDate", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "safeTransferItem",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "id", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "flagAndFreezeProduct",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "reason", type: "string" },
      { name: "riskScore", type: "uint8" },
    ],
    outputs: [],
  },
] as const;
