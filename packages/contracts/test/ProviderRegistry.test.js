import { expect } from "chai";
import hre from "hardhat";
import { getAddress, keccak256, toBytes } from "viem";

describe("ProviderRegistry", function () {
  async function deploy() {
    const providerRegistry = await hre.viem.deployContract("ProviderRegistry");
    const [walletClient] = await hre.viem.getWalletClients();
    return { providerRegistry, walletClient };
  }

  function endpointId(endpointUrl) {
    return keccak256(toBytes(endpointUrl));
  }

  it("registers a new provider and returns its id", async function () {
    const { providerRegistry, walletClient } = await deploy();
    const endpointUrl = "http://localhost:4001/price/eth";

    await providerRegistry.write.registerProvider([
      "Price Feed A",
      "price-feed",
      endpointUrl,
      10000n, // $0.01 in micro-USDC
      walletClient.account.address,
    ]);

    const id = endpointId(endpointUrl);
    const stored = await providerRegistry.read.getProvider([id]);

    expect(stored.name).to.equal("Price Feed A");
    expect(stored.category).to.equal("price-feed");
    expect(stored.endpointUrl).to.equal(endpointUrl);
    expect(stored.priceMicroUsdc).to.equal(10000n);
    expect(getAddress(stored.walletAddr)).to.equal(getAddress(walletClient.account.address));
    expect(stored.active).to.equal(true);
    expect(stored.registeredAt > 0n).to.equal(true);

    expect(await providerRegistry.read.providerCount()).to.equal(1n);
  });

  it("is idempotent by endpointUrl -- re-registering updates, not duplicates", async function () {
    const { providerRegistry, walletClient } = await deploy();
    const endpointUrl = "http://localhost:4001/price/eth";

    await providerRegistry.write.registerProvider([
      "Price Feed A",
      "price-feed",
      endpointUrl,
      10000n,
      walletClient.account.address,
    ]);
    await providerRegistry.write.registerProvider([
      "Price Feed A (renamed)",
      "price-feed",
      endpointUrl,
      12000n,
      walletClient.account.address,
    ]);

    expect(await providerRegistry.read.providerCount()).to.equal(1n);

    const id = endpointId(endpointUrl);
    const stored = await providerRegistry.read.getProvider([id]);
    expect(stored.name).to.equal("Price Feed A (renamed)");
    expect(stored.priceMicroUsdc).to.equal(12000n);
  });

  it("tracks multiple distinct providers", async function () {
    const { providerRegistry, walletClient } = await deploy();

    await providerRegistry.write.registerProvider([
      "Price Feed A",
      "price-feed",
      "http://localhost:4001/price/eth",
      10000n,
      walletClient.account.address,
    ]);
    await providerRegistry.write.registerProvider([
      "Price Feed B",
      "price-feed",
      "http://localhost:4002/price/eth",
      8000n,
      walletClient.account.address,
    ]);

    expect(await providerRegistry.read.providerCount()).to.equal(2n);
  });

  it("emits ProviderRegistered on registration", async function () {
    const { providerRegistry, walletClient } = await deploy();
    const endpointUrl = "http://localhost:4001/price/eth";

    const hash = await providerRegistry.write.registerProvider([
      "Price Feed A",
      "price-feed",
      endpointUrl,
      10000n,
      walletClient.account.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const events = await providerRegistry.getEvents.ProviderRegistered();

    expect(events).to.have.lengthOf(1);
    expect(events[0].args.id).to.equal(endpointId(endpointUrl));
    expect(events[0].args.name).to.equal("Price Feed A");
    expect(receipt.status).to.equal("success");
  });
});
