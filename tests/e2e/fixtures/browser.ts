import {
  chromium,
  test as base,
  type BrowserContext,
  Worker,
} from "@playwright/test";
import path from "path";
import * as fs from "fs";
import AdmZip from "adm-zip";

const downloadAndUnzip = async (url: string, targetDirectory: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Cannot download file: ${response.status} ${response.statusText}`
    );
  }

  const zipBuffer = Buffer.from(await response.arrayBuffer());

  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory, { recursive: true });
  }

  const zipFilePath = path.join(targetDirectory, "temp.zip");
  fs.writeFileSync(zipFilePath, zipBuffer);

  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(targetDirectory, true);

  fs.unlinkSync(zipFilePath);
};

export type BrowserOptions = {
  newHeadless: boolean;
  extensionVersion?: string;
  context: BrowserContext;
  extensionId: string;
  background: Worker;
};

export const test = base.extend<BrowserOptions>({
  newHeadless: [false, { option: true }],
  extensionVersion: ["latest", { option: true }],
  context: async ({ newHeadless, extensionVersion }, use) => {
    const extensionUrl = `https://github.com/dapplets/dapplet-extension/releases/download/${extensionVersion}/dapplet-extension.zip`;
    const extensionsPath = path.join(__dirname, "..", "artifacts");
    const versionPath = path.join(extensionsPath, extensionVersion);

    if (!fs.existsSync(versionPath)) {
      await downloadAndUnzip(extensionUrl, versionPath);
    }

    const args = [
      `--disable-extensions-except=${versionPath}`,
      `--load-extension=${versionPath}`,
    ];

    if (newHeadless) {
      args.push("--headless=new");
    }

    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args,
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent("serviceworker");

    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
  background: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent("serviceworker");
    await use(background);
  },
});

export const expect = test.expect;
