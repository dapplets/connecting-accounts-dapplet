import { test as base } from "./browser";

type DappletRunnerFixtures = {
  skipOnboarding(): Promise<void>;
  enableDevServer(devServerUrl: string): Promise<void>;
  activateDapplet(dappletName: string, registryUrl: string): Promise<void>;
  deactivateDapplet(dappletName: string, registryUrl: string): Promise<void>;
};

export const test = base.extend<DappletRunnerFixtures>({
  skipOnboarding: async ({ background }, use) => {
    await use(async () => {
      await background.evaluate(() =>
        globalThis.dapplets.setIsFirstInstallation(false)
      );
    });
  },
  enableDevServer: async ({ background }, use) => {
    await use(async (devServerUrl) => {
      await background.evaluate(
        (devServerUrl) => globalThis.dapplets.addRegistry(devServerUrl, true),
        devServerUrl
      );
      await background.evaluate(
        (devServerUrl) => globalThis.dapplets.enableRegistry(devServerUrl),
        devServerUrl
      );
    });
  },
  activateDapplet: async ({ background }, use) => {
    await use(async (name, registryUrl) => {
      await background.evaluate(
        (params) => globalThis.dapplets.activateDapplet(params),
        {
          name,
          registryUrl,
        }
      );
    });
  },
  deactivateDapplet: async ({ background }, use) => {
    await use(async (name, registryUrl) => {
      await background.evaluate(
        (params) => globalThis.dapplets.deactivateDapplet(params),
        {
          name,
          registryUrl,
        }
      );
    });
  },
});

export { expect } from "@playwright/test";
