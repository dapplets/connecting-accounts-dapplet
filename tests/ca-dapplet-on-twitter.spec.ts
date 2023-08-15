import { expect, test } from "@dapplets/dapplet-playwright";

const urlToOpen = 'https://twitter.com/teremovskii'
const dappletIdToActivate = 'connecting-accounts-dapplet'
const registryUrl = "http://localhost:3001/dapplet.json"

// ToDo: Qase ID = 34
// ToDo: unskip when popup will be implemented
test.skip("should open popup with accounts on Twitter", async ({
  page,
  enableDevServer,
  activateDapplet,
}) => {
  await page.goto(urlToOpen);

  await enableDevServer(registryUrl);
  await activateDapplet(dappletIdToActivate, registryUrl);

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

  // check the link to accounts page
  await expect(
    page.locator(".dapplets-connected-accounts-wrapper >> .accounts")
  ).toBeVisible();

  // popup closes after click
  await expect(
    page.locator(".dapplets-connected-accounts-wrapper >> .accounts")
  ).toBeVisible();
  await page.click("body", { force: true });
  await expect(
    page.locator(".dapplets-connected-accounts-wrapper >> .accounts")
  ).not.toBeVisible();
});
