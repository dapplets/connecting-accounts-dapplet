import { expect, test } from "../fixtures/dapplet-runner";

const urlToOpen = 'https://twitter.com/alsakhaev/status/1691462269182611456'
const dappletIdToActivate = 'connecting-accounts-dapplet'
const registryUrl = "http://localhost:3001/dapplet.json"

test("should inject avatar badge in the post on Twitter", async ({
  page,
  enableDevServer,
  activateDapplet,
}) => {
  await page.goto(urlToOpen);

  await enableDevServer(registryUrl);
  await activateDapplet(dappletIdToActivate, registryUrl);

  // avatar badge should be visible
  await expect(page.locator('.dapplet-widget img')).toBeVisible();
});
