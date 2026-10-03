// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ProviderRegistry
/// @notice Minimal on-chain record of x402 providers. Purely a public,
/// immutable-per-entry trust anchor -- the actual routing/reputation
/// system lives off-chain (see packages/registry) for speed and to avoid
/// a gas cost on every routed call. This contract only changes state
/// once per provider, at registration/update time.
contract ProviderRegistry {
    struct Provider {
        string name;
        string category;
        string endpointUrl;
        uint256 priceMicroUsdc; // price in USDC's native 6-decimal smallest unit
        address walletAddr;
        bool active;
        uint64 registeredAt;
    }

    mapping(bytes32 => Provider) public providers;
    bytes32[] public providerIds;

    event ProviderRegistered(
        bytes32 indexed id,
        string name,
        string category,
        address walletAddr,
        uint256 priceMicroUsdc
    );

    /// @notice Register or update a provider. Idempotent by `endpointUrl`,
    /// matching the off-chain registry's dedup semantics -- re-registering
    /// the same endpoint updates the existing entry instead of creating a
    /// duplicate.
    function registerProvider(
        string calldata name,
        string calldata category,
        string calldata endpointUrl,
        uint256 priceMicroUsdc,
        address walletAddr
    ) external returns (bytes32 id) {
        id = keccak256(abi.encodePacked(endpointUrl));

        if (providers[id].registeredAt == 0) {
            providerIds.push(id);
        }

        providers[id] = Provider({
            name: name,
            category: category,
            endpointUrl: endpointUrl,
            priceMicroUsdc: priceMicroUsdc,
            walletAddr: walletAddr,
            active: true,
            registeredAt: uint64(block.timestamp)
        });

        emit ProviderRegistered(id, name, category, walletAddr, priceMicroUsdc);
    }

    function getProvider(bytes32 id) external view returns (Provider memory) {
        return providers[id];
    }

    function providerCount() external view returns (uint256) {
        return providerIds.length;
    }

    function getProviderIdAt(uint256 index) external view returns (bytes32) {
        return providerIds[index];
    }
}
