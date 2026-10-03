// scripts/deploy.mjs
//
// Deploys ProviderRegistry.sol using a CDP-managed account -- no raw
// private key ever touches this machine.
//
// CDP's remote signEvmTransaction/sendEvmTransaction endpoints turn out
// not to support contract-creation transactions (no `to` field, the
// standard EVM signal for "deploy new code"): CDP's backend tries to
// decode the transaction itself and rejects an empty `to` with
// "input string too short for common.Address" (confirmed by testing
// against Base Sepolia). So instead of asking CDP to sign/send the
// transaction, we use its lower-level primitive -- signing an arbitrary
// hash (`account.sign({ hash })`, the same primitive CDP's own SDK uses
// internally for non-string messages) -- and assemble the fully signed
// transaction ourselves with viem: serialize unsigned -> hash -> sign
// via CDP -> parse the signature -> serialize signed -> broadcast. CDP
// never sees the transaction structure, only a hash to sign, so its
// `to`-decoding limitation never comes into play.

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { CdpClient } from "@coinbase/cdp-sdk";
import { createPublicClient, http, keccak256, parseSignature, serializeTransaction } from "viem";
import { base, baseSepolia } from "viem/chains";

const X402_ENVIRONMENT = process.env.X402_ENVIRONMENT || "development";
const DEPLOYER_ACCOUNT_NAME = process.env.DEPLOYER_ACCOUNT_NAME || "x402-contract-deployer";
const chain = X402_ENVIRONMENT === "production" ? base : baseSepolia;

async function main() {
  const artifactPath = new URL(
    "../artifacts/contracts/ProviderRegistry.sol/ProviderRegistry.json",
    import.meta.url
  );
  const artifact = JSON.parse(await readFile(artifactPath, "utf-8"));
  const { abi, bytecode } = artifact;

  const cdp = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    walletSecret: process.env.CDP_WALLET_SECRET,
  });
  const account = await cdp.evm.getOrCreateAccount({ name: DEPLOYER_ACCOUNT_NAME });

  console.log(`[deploy] environment=${X402_ENVIRONMENT} chain=${chain.name} (${chain.id})`);
  console.log(`[deploy] deployer account: ${account.address}`);

  const publicClient = createPublicClient({ chain, transport: http() });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`[deploy] deployer ETH balance: ${balance} wei`);
  if (balance === 0n) {
    throw new Error(
      `Deployer account ${account.address} has zero ETH on ${chain.name}. ` +
        `Fund it before deploying (faucet for Base Sepolia, a real transfer for Base mainnet).`
    );
  }

  const [nonce, fees, gas] = await Promise.all([
    publicClient.getTransactionCount({ address: account.address }),
    publicClient.estimateFeesPerGas(),
    publicClient.estimateGas({ account: account.address, data: bytecode }),
  ]);

  const transaction = {
    type: "eip1559",
    chainId: chain.id,
    nonce,
    data: bytecode,
    gas: (gas * 120n) / 100n, // 20% headroom over the estimate
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    value: 0n,
  };

  console.log("[deploy] hashing unsigned transaction...");
  const unsignedSerialized = serializeTransaction(transaction);
  const txHash = keccak256(unsignedSerialized);

  console.log("[deploy] signing hash via CDP...");
  const rawSignature = await account.sign({ hash: txHash });
  const signature = parseSignature(rawSignature);

  const signedTx = serializeTransaction(transaction, signature);

  console.log("[deploy] broadcasting...");
  const hash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx });
  console.log(`[deploy] tx hash: ${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) {
    throw new Error(`Deployment failed or missing contractAddress. Receipt: ${JSON.stringify(receipt)}`);
  }

  console.log(`[deploy] ProviderRegistry deployed at: ${receipt.contractAddress}`);
  console.log(`[deploy] view on explorer: ${chain.blockExplorers.default.url}/address/${receipt.contractAddress}`);
}

main().catch((err) => {
  console.error("[deploy] failed:", err);
  process.exit(1);
});
