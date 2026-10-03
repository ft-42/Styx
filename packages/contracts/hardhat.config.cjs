// .cjs extension: this package is "type": "module" (matches the rest of
// the repo's convention), but Hardhat's own config loader expects
// CommonJS -- naming it .cjs sidesteps that mismatch without changing
// the package's module type.
require("dotenv/config");
require("@nomicfoundation/hardhat-toolbox-viem");

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: "0.8.24",
  // Read-only network entries -- no `accounts` (no private keys here).
  // Deployment signs via a CDP-managed account (scripts/deploy.mjs), not
  // Hardhat's own signer system. These exist only so `hardhat verify` can
  // reach each chain's RPC and explorer.
  networks: {
    base: {
      url: "https://mainnet.base.org",
      chainId: 8453,
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
