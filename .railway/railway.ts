import { defineRailway, project, service } from "railway/iac";

// This monorepo uses npm workspaces -- every service builds/starts from
// the repo root (default) so `npm install` resolves and hoists shared
// dependencies the same way it does locally, then targets its own
// package via `--workspace=`. See README.md for the local-dev equivalent
// of each command.
//
// CDP credentials and cross-service URLs (REGISTRY_URL, etc.) are
// deliberately NOT set here -- they're set via `railway variables` so no
// secret values ever get written into this committed file. See
// docs/hosting.md for the full variable list per service.

export default defineRailway(() => {
  const registry = service("registry", {
    start: "npm run start --workspace=packages/registry",
    replicas: { ams: 1 },
  });

  const providerA = service("provider-a", {
    start: "npm run start --workspace=packages/resource-server",
    env: {
      PROVIDER_NAME: "Price Feed A",
      ASSET: "ETH",
      PRICE: "$0.01",
      X402_ENVIRONMENT: "production",
      PROVIDER_REGISTRY_ADDRESS: "0x4dfb3aca5bd61f9be7cb51a97a17376d9ec7466e",
    },
    replicas: { ams: 1 },
  });

  const providerB = service("provider-b", {
    start: "npm run start --workspace=packages/resource-server",
    env: {
      PROVIDER_NAME: "Price Feed B",
      ASSET: "ETH",
      PRICE: "$0.008",
      X402_ENVIRONMENT: "production",
      PROVIDER_REGISTRY_ADDRESS: "0x4dfb3aca5bd61f9be7cb51a97a17376d9ec7466e",
    },
    replicas: { ams: 1 },
  });

  const providerC = service("provider-c", {
    start: "npm run start --workspace=packages/resource-server",
    env: {
      PROVIDER_NAME: "Price Feed C",
      ASSET: "ETH",
      PRICE: "$0.012",
      X402_ENVIRONMENT: "production",
      PROVIDER_REGISTRY_ADDRESS: "0x4dfb3aca5bd61f9be7cb51a97a17376d9ec7466e",
    },
    replicas: { ams: 1 },
  });

  const demoAgent = service("demo-agent", {
    start: "npm run start --workspace=packages/demo-agent",
    env: {
      X402_ENVIRONMENT: "production",
      AGENT_INTERVAL_MS: "900000",
    },
    replicas: { ams: 1 },
  });

  const dashboard = service("dashboard", {
    build: "npm run build --workspace=packages/dashboard",
    start: "npm run start --workspace=packages/dashboard",
    replicas: { ams: 1 },
  });

  return project("x402-agent-commerce", {
    resources: [registry, providerA, providerB, providerC, demoAgent, dashboard],
  });
});
