import { expect, test } from "@dapplets/dapplet-playwright";

const urlToOpen = "https://github.com/Ni-2";
const urlToCheck = "https://twitter.com/teremovskii";
const dappletIdToActivate = "connecting-accounts-dapplet";
const registryUrl = "http://localhost:3001/dapplet.json"

// ToDo: Qase ID = 3
// ToDo: unskip test when GitHub and popups will be implemented
test.skip("should open popup with accounts on GitHub", async ({
  page,
  enableDevServer,
  activateDapplet,
}) => {
  await page.goto(urlToOpen);

  await enableDevServer(registryUrl);
  await activateDapplet(dappletIdToActivate, registryUrl);

  // find avatar badge
  const avatarBadge = page.locator(".dapplet-widget");
  await expect(avatarBadge).toBeVisible();

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

  const accountLink = await page.locator(
    ".dapplets-connected-accounts-wrapper >> .account:has-text('teremovskii')"
  );

  const accountLinkAttributes = await accountLink.getAttribute("href");
  expect(accountLinkAttributes).toBe(urlToCheck);

  const accountLinkTarget = await accountLink.getAttribute("target");
  expect(accountLinkTarget).toBe("_blank");

  // popup closes after click
  await expect(
    page.locator(".dapplets-connected-accounts-wrapper >> .accounts")
  ).toBeVisible();
  await page.click("body", { force: true });
  await expect(
    page.locator(".dapplets-connected-accounts-wrapper >> .accounts")
  ).not.toBeVisible();
});
