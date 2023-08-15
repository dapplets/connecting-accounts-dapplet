import { expect, test } from "../fixtures/dapplet-runner";

const urlToOpen = "https://twitter.com/teremovskii";
const dappletIdToActivate = "connecting-accounts-dapplet";
const registryUrl = "http://localhost:3001/dapplet.json";

// ToDo: Qase ID = 18
// ToDo: unskip when popup will be implemented
test.skip("should open different popup when network is switched", async ({
  page,
  enableDevServer,
  activateDapplet,
}) => {
  await page.goto(urlToOpen);

  await enableDevServer(registryUrl);
  await activateDapplet(dappletIdToActivate, registryUrl);

  // open overlay
  await page.waitForFunction(() => !!window["dapplets"]);
  await page.evaluate("window.dapplets.openPopup()");
  await page.locator('#dapplets-overlay-manager').getByTestId('system-tab-dapplets').click()

  // switch networks
  await page.getByTestId("system-tab-settings").click();
  await page
    .getByTestId("preferred-connected-accounts-network")
    .getByText("mainnet")
    .click();
  await page.waitForTimeout(1000);
  await page
    .getByTestId("preferred-connected-accounts-network")
    .getByTestId("opened-dropdown")
    .getByTestId("testnet")
    .click({ force: true });

  // find avatar badge
  await expect(page.locator(".dapplet-widget")).toBeVisible();

  // popup is not visible
  const accounts = page
    .locator(".dapplets-connected-accounts-wrapper")
    .locator(".accounts");
  await expect(accounts).not.toBeVisible();

  // open popup and find more than 1 connected accounts
  await page.locator(".dapplet-widget").locator(".profile-badge").click();
  await expect(accounts).toBeVisible();
  await expect(
    accounts.locator(".account-container > *").count()
  ).toBeGreaterThan(1);

  // find nikter.near among accounts
  await page.waitForSelector(
    ".dapplets-connected-accounts-wrapper >> text=nikter.near"
  );
});
